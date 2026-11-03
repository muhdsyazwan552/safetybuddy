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
            // issued automatically when a Training Provider's payment is confirmed; passed on to new companies
            $table->string('reference_code', 20)->nullable()->unique()->after('code');
        });

        // Training Providers that already paid (account type 2) get their code now
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        DB::table('company')->where('account_type_id', 2)->whereNull('reference_code')->pluck('id')->each(function ($id) use ($alphabet) {
            do {
                $code = 'TP-';
                for ($i = 0; $i < 6; $i++) {
                    $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
                }
            } while (DB::table('company')->where('reference_code', $code)->exists());

            DB::table('company')->where('id', $id)->update(['reference_code' => $code]);
        });
    }

    public function down(): void
    {
        Schema::table('company', function (Blueprint $table) {
            $table->dropUnique(['reference_code']);
            $table->dropColumn('reference_code');
        });
    }
};
