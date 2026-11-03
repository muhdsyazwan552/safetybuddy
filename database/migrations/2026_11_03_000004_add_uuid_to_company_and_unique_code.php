<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('company', 'uuid')) {
            Schema::table('company', function (Blueprint $table) {
                $table->char('uuid', 36)->nullable()->after('id');
            });
        }

        DB::table('company')->whereNull('uuid')->orderBy('id')->each(function ($company) {
            DB::table('company')->where('id', $company->id)->update(['uuid' => (string) Str::uuid()]);
        });

        $indexes = collect(DB::select('SHOW INDEX FROM company'))->pluck('Key_name');
        Schema::table('company', function (Blueprint $table) use ($indexes) {
            if (!$indexes->contains('company_uuid_unique')) {
                $table->unique('uuid');
            }
            if (!$indexes->contains('company_code_unique')) {
                $table->unique('code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('company', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }
};
