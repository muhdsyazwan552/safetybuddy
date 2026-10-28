<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // status was SET('active','Inactive'); it now also needs 'pending' (briefing not approved yet)
        DB::statement("ALTER TABLE subcon_staff MODIFY status VARCHAR(20) NULL DEFAULT 'pending'");

        // Workers whose briefing is not approved yet are Pending; approved ones are Active.
        DB::table('subcon_staff')->where('sp_briefing_status', '<>', 'done')->update(['status' => 'pending']);
    }

    public function down(): void
    {
        DB::table('subcon_staff')->where('status', 'pending')->update(['status' => 'active']);
    }
};
