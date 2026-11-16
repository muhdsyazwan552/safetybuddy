<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Enterprise package includes 2 Contractor Representatives. */
    public function up(): void
    {
        DB::table('subscription_plans')
            ->where('code', 'ENTERPRISE')
            ->where('contractor_limit', 1)
            ->update(['contractor_limit' => 2, 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('subscription_plans')
            ->where('code', 'ENTERPRISE')
            ->where('contractor_limit', 2)
            ->update(['contractor_limit' => 1, 'updated_at' => now()]);
    }
};
