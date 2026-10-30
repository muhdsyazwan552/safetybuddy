<?php

use App\Support\SeriesCodes;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'tbx' => 'toolbox_talks',
        'ins' => 'inspections',
        'nc' => 'non_conformances',
        'cc' => 'client_complaints',
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
        $inspectionCompany = DB::table('inspections')->get(['id', 'company_id', 'project_id'])
            ->mapWithKeys(fn ($i) => [$i->id => $i->company_id ?: ($projectCompany[$i->project_id] ?? null)]);

        foreach (self::TABLES as $type => $table) {
            $counters = [];
            foreach (DB::table($table)->orderBy('created_at')->orderBy('id')->get() as $row) {
                $companyId = match ($type) {
                    'tbx' => $projectCompany[$row->project_id] ?? null,
                    'ins' => $inspectionCompany[$row->id] ?? null,
                    default => $inspectionCompany[$row->inspection_id] ?? null,
                };
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
        DB::table('series_code_counters')->where('scope', 'regexp', '^(tbx|ins|nc|cc):')->delete();
    }
};
