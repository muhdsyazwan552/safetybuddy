<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Compliance Metrics and Penalty Settings become one table:
 * every row has a title, a description, a percent setting and a penalty value (RM).
 *
 * The old `penalty_settings` table is left in place (not dropped) so nothing is lost;
 * existing penalty rows are copied into `compliance_metrics`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('compliance_metrics', 'value')) {
            Schema::table('compliance_metrics', function (Blueprint $table) {
                $table->decimal('value', 20, 6)->nullable()->after('percent');
            });
        }

        if (!Schema::hasTable('penalty_settings')) {
            return;
        }

        foreach (DB::table('penalty_settings')->get() as $penalty) {
            $match = DB::table('compliance_metrics')
                ->where('company_id', $penalty->company_id)
                ->whereRaw('LOWER(TRIM(title)) = ?', [mb_strtolower(trim((string) $penalty->title))])
                ->first();

            if ($match) {
                DB::table('compliance_metrics')->where('id', $match->id)->update([
                    'value' => $penalty->value,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('compliance_metrics')->insert([
                    'company_id' => $penalty->company_id,
                    'title' => $penalty->title,
                    'description' => $penalty->description,
                    'percent' => null,
                    'value' => $penalty->value,
                    'created_at' => $penalty->created_at ?? now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('compliance_metrics', 'value')) {
            Schema::table('compliance_metrics', function (Blueprint $table) {
                $table->dropColumn('value');
            });
        }
    }
};
