<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Contractor Training Provider package: same seats and report limits as Professional, RM 700.
        // It has its own audience so it is sold only by Training Providers (their Packages page) and never listed publicly.
        $professional = DB::table('subscription_plans')->where('code', 'PROFESSIONAL')->first();
        if (! $professional || DB::table('subscription_plans')->where('code', 'CONTRACTOR_TRAINING_PROVIDER')->exists()) {
            return;
        }

        $now = now();
        DB::table('subscription_plans')->insert([
            'code' => 'CONTRACTOR_TRAINING_PROVIDER',
            'audience' => 'contractor_provider',
            'name' => 'Contractor Training Provider',
            'price_yearly' => 700,
            'provider_price_yearly' => 700,
            'manager_limit' => $professional->manager_limit,
            'supervisor_limit' => $professional->supervisor_limit,
            'inspector_limit' => $professional->inspector_limit,
            'contractor_limit' => $professional->contractor_limit,
            'daily_pdf_limit' => $professional->daily_pdf_limit,
            'monthly_pdf_limit' => $professional->monthly_pdf_limit,
            'is_active' => true,
            'sort_order' => (DB::table('subscription_plans')->max('sort_order') ?? 0) + 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        $plan = DB::table('subscription_plans')->where('code', 'CONTRACTOR_TRAINING_PROVIDER')->first();
        if ($plan && ! DB::table('package_activation_codes')->where('plan_id', $plan->id)->exists()
            && ! DB::table('subscriptions_company')->where('subscription_plan_id', $plan->id)->exists()) {
            DB::table('subscription_plans')->where('id', $plan->id)->delete();
        }
    }
};
