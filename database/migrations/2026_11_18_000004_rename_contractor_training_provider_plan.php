<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('subscription_plans')->where('code', 'CONTRACTOR_TRAINING_PROVIDER')->update(['name' => 'Participant']);
    }

    public function down(): void
    {
        DB::table('subscription_plans')->where('code', 'CONTRACTOR_TRAINING_PROVIDER')->update(['name' => 'Contractor Training Provider']);
    }
};
