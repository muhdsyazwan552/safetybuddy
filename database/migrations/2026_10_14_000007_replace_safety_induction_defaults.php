<?php

use App\Support\SafetyInductionDefaults;
use App\Support\SubconCompliance;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The safety induction defaults were first loaded from the wrong appendix.
 * The correct content is Appendix B "Contractor safety declarations" (12 declarations).
 *
 * For every company: the old default topics (the 13 from the wrong appendix) are removed
 * together with their subcontractor acknowledgements and replaced by the 12 declarations.
 * Topics a company created itself (no default_key) are kept after them.
 */
return new class extends Migration
{
    public function up(): void
    {
        $companyIds = DB::table('safety_induction_topics')->distinct()->pluck('company_id');

        foreach ($companyIds as $companyId) {
            DB::transaction(function () use ($companyId) {
                $oldIds = DB::table('safety_induction_topics')
                    ->where('company_id', $companyId)
                    ->whereNotNull('default_key')
                    ->pluck('id');

                DB::table('subcon_induction_acks')->whereIn('topic_id', $oldIds)->delete();
                DB::table('safety_induction_items')->whereIn('topic_id', $oldIds)->delete();
                DB::table('safety_induction_topics')->whereIn('id', $oldIds)->delete();

                $keys = array_keys(SafetyInductionDefaults::topics());
                $order = 0;
                foreach ($keys as $key) {
                    SafetyInductionDefaults::createTopic((int) $companyId, $key, ++$order);
                }

                // keep the company's own topics after the declarations
                $custom = DB::table('safety_induction_topics')
                    ->where('company_id', $companyId)
                    ->whereNull('default_key')
                    ->orderBy('sort_order')->orderBy('id')
                    ->pluck('id');
                foreach ($custom as $id) {
                    DB::table('safety_induction_topics')->where('id', $id)->update(['sort_order' => ++$order]);
                }
            });

            // subcontractors must acknowledge the corrected declarations
            try {
                SubconCompliance::syncAllFor((int) $companyId);
            } catch (\Throwable $e) {
                // status sync is re-run whenever a portal page is opened
            }
        }
    }

    public function down(): void
    {
        // content correction – nothing to undo
    }
};
