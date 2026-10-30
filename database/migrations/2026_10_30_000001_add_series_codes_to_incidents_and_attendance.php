<?php

use App\Support\SeriesCodes;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Same per-company series codes as toolbox talks / inspections: ABC/INC/001 (incident), ABC/ATT/001 (daily attendance). */
    private const TABLES = [
        'inc' => 'incident',
        'att' => 'manhours',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $t) use ($table) {
                $t->unsignedInteger('serial_no')->nullable();
                $t->string('code', 60)->nullable()->unique($table . '_code_unique');
            });
        }

        $companyCodes = DB::table('company')->pluck('code', 'id');
        $projectCompany = DB::table('projects')->pluck('company_id', 'id');

        foreach (self::TABLES as $type => $table) {
            $counters = [];
            foreach (DB::table($table)->orderBy('created_at')->orderBy('id')->get() as $row) {
                $companyId = $row->company_id ?: ($projectCompany[$row->project_id] ?? null);
                $key = (int) $companyId;
                $sequence = $counters[$key] = ($counters[$key] ?? 0) + 1;
                DB::table($table)->where('id', $row->id)->update([
                    'serial_no' => $sequence,
                    'code' => ($companyCodes[$companyId] ?? null ?: 'CO') . '/' . SeriesCodes::RECORD_SEGMENTS[$type] . '/' . SeriesCodes::number($sequence),
                ]);
            }
            foreach ($counters as $key => $last) {
                DB::table('series_code_counters')->updateOrInsert(['scope' => "{$type}:{$key}"], ['next_number' => $last + 1]);
            }
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $t) use ($table) {
                $t->dropUnique($table . '_code_unique');
                $t->dropColumn(['serial_no', 'code']);
            });
        }
        DB::table('series_code_counters')->where('scope', 'regexp', '^(inc|att):')->delete();
    }
};
