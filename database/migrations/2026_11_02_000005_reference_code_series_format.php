<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company', function (Blueprint $table) {
            $table->string('reference_code', 40)->nullable()->change();
        });

        // reference codes now follow the provider's company code: SBT-XXXX-XXXX-XXXX
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        DB::table('company')->where('account_type_id', 2)->get(['id', 'code'])->each(function ($company) use ($alphabet) {
            do {
                $groups = [];
                for ($g = 0; $g < 3; $g++) {
                    $group = '';
                    for ($i = 0; $i < 4; $i++) {
                        $group .= $alphabet[random_int(0, strlen($alphabet) - 1)];
                    }
                    $groups[] = $group;
                }
                $code = ($company->code ?: 'TP').'-'.implode('-', $groups);
            } while (DB::table('company')->where('reference_code', $code)->exists());

            DB::table('company')->where('id', $company->id)->update(['reference_code' => $code]);
        });
    }

    public function down(): void
    {
        Schema::table('company', function (Blueprint $table) {
            $table->string('reference_code', 20)->nullable()->change();
        });
    }
};
