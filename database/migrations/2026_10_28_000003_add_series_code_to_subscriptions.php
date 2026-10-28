<?php

use App\Support\SeriesCodes;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions_company', function (Blueprint $table) {
            $table->unsignedInteger('serial_no')->nullable();
            $table->string('code', 60)->nullable()->unique();
            $table->unique(['company_id', 'serial_no'], 'subscriptions_company_series_unique');
        });

        foreach (DB::table('company')->orderBy('id')->get(['id', 'code']) as $company) {
            $ids = DB::table('subscriptions_company')->where('company_id', $company->id)->orderBy('id')->pluck('id');
            foreach ($ids as $index => $id) {
                $sequence = $index + 1;
                DB::table('subscriptions_company')->where('id', $id)->update([
                    'serial_no' => $sequence,
                    'code' => ($company->code ?: 'CO') . '/SUB/' . SeriesCodes::number($sequence),
                ]);
            }
            DB::table('series_code_counters')->updateOrInsert(
                ['scope' => 'subscription:' . $company->id],
                ['next_number' => $ids->count() + 1]
            );
        }
    }

    public function down(): void
    {
        Schema::table('subscriptions_company', function (Blueprint $table) {
            $table->dropUnique('subscriptions_company_series_unique');
            $table->dropUnique(['code']);
            $table->dropColumn(['serial_no', 'code']);
        });
    }
};
