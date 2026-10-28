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
        Schema::create('series_code_counters', function (Blueprint $table) {
            $table->string('scope')->primary();
            $table->unsignedInteger('next_number');
        });
        DB::table('series_code_counters')->insert(['scope' => 'company', 'next_number' => 1]);

        Schema::table('company', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->unique();
        });
        Schema::table('company_staff', function (Blueprint $table) {
            $table->unsignedInteger('serial_no')->nullable();
            $table->string('code', 60)->nullable()->unique();
            $table->unique(['company_id', 'serial_no']);
        });
        Schema::table('subcon_company', function (Blueprint $table) {
            $table->string('code_prefix', 10)->nullable();
            $table->unsignedInteger('serial_no')->nullable();
            $table->string('code', 80)->nullable()->unique();
            $table->unique(['company_id', 'code_prefix', 'serial_no'], 'subcon_company_series_unique');
        });
        Schema::table('subcon_staff', function (Blueprint $table) {
            $table->unsignedInteger('serial_no')->nullable();
            $table->string('code', 120)->nullable()->unique();
            $table->unique(['company_id', 'serial_no']);
        });

        $usedCompanyCodes = [];
        foreach (DB::table('company')->orderBy('id')->get(['id', 'name']) as $company) {
            $base = SeriesCodes::prefix($company->name);
            $code = $base;
            $suffix = 2;
            while (isset($usedCompanyCodes[$code])) {
                $code = $base . $suffix++;
            }
            $usedCompanyCodes[$code] = true;
            DB::table('company')->where('id', $company->id)->update(['code' => $code]);

            foreach (DB::table('company_staff')->where('company_id', $company->id)->orderBy('id')->pluck('id') as $index => $id) {
                $sequence = $index + 1;
                DB::table('company_staff')->where('id', $id)->update([
                    'serial_no' => $sequence,
                    'code' => $code . '/EMP/' . SeriesCodes::number($sequence),
                ]);
            }
            DB::table('series_code_counters')->insert([
                'scope' => 'employee:' . $company->id,
                'next_number' => DB::table('company_staff')->where('company_id', $company->id)->count() + 1,
            ]);

            $subconSequences = [];
            foreach (DB::table('subcon_company')->where('company_id', $company->id)->orderBy('id')->get(['id', 'name']) as $subcon) {
                $prefix = SeriesCodes::prefix($subcon->name);
                $sequence = ($subconSequences[$prefix] ?? 0) + 1;
                $subconSequences[$prefix] = $sequence;
                $subconCode = $code . '/' . $prefix . '/' . SeriesCodes::number($sequence);
                DB::table('subcon_company')->where('id', $subcon->id)->update([
                    'code_prefix' => $prefix,
                    'serial_no' => $sequence,
                    'code' => $subconCode,
                ]);

                DB::table('series_code_counters')->updateOrInsert(
                    ['scope' => 'subcon:' . $company->id . ':' . $prefix],
                    ['next_number' => $sequence + 1]
                );

                foreach (DB::table('subcon_staff')->where('company_id', $subcon->id)->orderBy('id')->pluck('id') as $index => $staffId) {
                    $staffSequence = $index + 1;
                    DB::table('subcon_staff')->where('id', $staffId)->update([
                        'serial_no' => $staffSequence,
                        'code' => $subconCode . '/STF/' . SeriesCodes::number($staffSequence),
                    ]);
                }
                DB::table('series_code_counters')->insert([
                    'scope' => 'staff:' . $subcon->id,
                    'next_number' => DB::table('subcon_staff')->where('company_id', $subcon->id)->count() + 1,
                ]);
            }
        }

        // Keep a usable identifier on historical staff whose executor was deleted.
        foreach (DB::table('subcon_staff')->whereNull('code')->orderBy('id')->pluck('id') as $index => $id) {
            $sequence = $index + 1;
            DB::table('subcon_staff')->where('id', $id)->update([
                'serial_no' => $sequence,
                'code' => 'UNASSIGNED/STF/' . SeriesCodes::number($sequence),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('subcon_staff', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropUnique(['company_id', 'serial_no']);
            $table->dropColumn(['serial_no', 'code']);
        });
        Schema::table('subcon_company', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropUnique('subcon_company_series_unique');
            $table->dropColumn(['code_prefix', 'serial_no', 'code']);
        });
        Schema::table('company_staff', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropUnique(['company_id', 'serial_no']);
            $table->dropColumn(['serial_no', 'code']);
        });
        Schema::table('company', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });
        Schema::dropIfExists('series_code_counters');
    }
};
