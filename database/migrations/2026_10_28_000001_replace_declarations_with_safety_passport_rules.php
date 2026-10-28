<?php

use App\Support\SafetyInductionDefaults;
use App\Support\SubconCompliance;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('toolbox_topic')->where('code', 'C02-12')->where('name', 'Safety Induction')->update(['name' => 'Safety Passport']);
        $companyIds = DB::table('safety_induction_topics')->distinct()->pluck('company_id');

        foreach ($companyIds as $companyId) {
            DB::transaction(function () use ($companyId) {
                // Fresh installations may already have the 14 new defaults from the earlier seed migration.
                if (DB::table('safety_induction_topics')->where('company_id', $companyId)->where('default_key', 14)->exists()) {
                    return;
                }

                // Preserve the previous declarations and their acknowledgements for history.
                $oldIds = DB::table('safety_induction_topics')
                    ->where('company_id', $companyId)
                    ->whereNotNull('default_key')
                    ->pluck('id');

                DB::table('safety_induction_topics')->whereIn('id', $oldIds)->update([
                    'default_key' => DB::raw('default_key + 100'),
                    'is_active' => false,
                    'updated_at' => now(),
                ]);

                $order = 0;
                foreach (array_keys(SafetyInductionDefaults::topics()) as $key) {
                    SafetyInductionDefaults::createTopic((int) $companyId, $key, ++$order);
                }

                // Keep company-authored topics after the new rules, then the hidden legacy declarations.
                $customIds = DB::table('safety_induction_topics')
                    ->where('company_id', $companyId)
                    ->whereNull('default_key')
                    ->whereNotIn('id', $oldIds)
                    ->orderBy('sort_order')->orderBy('id')
                    ->pluck('id');
                foreach ($customIds->concat($oldIds) as $id) {
                    DB::table('safety_induction_topics')->where('id', $id)->update(['sort_order' => ++$order]);
                }
            });

            SubconCompliance::syncAllFor((int) $companyId);
        }
    }

    public function down(): void
    {
        // Preserve the new rules and historical acknowledgements.
    }
};
