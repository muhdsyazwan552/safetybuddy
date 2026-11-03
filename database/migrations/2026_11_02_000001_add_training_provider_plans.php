<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('subscription_plans', 'audience')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->string('audience', 30)->default('normal')->after('code');
            });
        }

        if (! Schema::hasColumn('subscription_plan_requests', 'training_provider_company_id')) {
            Schema::table('subscription_plan_requests', function (Blueprint $table) {
                $table->unsignedInteger('training_provider_company_id')->nullable()->after('company_id')->index();
            });
        }

        // Training Provider package: same details and price as Starter, different name.
        $starter = DB::table('subscription_plans')->where('code', 'STARTER')->first();
        if ($starter && ! DB::table('subscription_plans')->where('code', 'TRAINING_PROVIDER')->exists()) {
            $now = now();
            DB::table('subscription_plans')->insert([
                'code' => 'TRAINING_PROVIDER',
                'audience' => 'training_provider',
                'name' => 'Training Provider',
                'price_yearly' => $starter->price_yearly,
                'manager_limit' => $starter->manager_limit,
                'supervisor_limit' => $starter->supervisor_limit,
                'inspector_limit' => $starter->inspector_limit,
                'contractor_limit' => $starter->contractor_limit,
                'daily_pdf_limit' => $starter->daily_pdf_limit,
                'monthly_pdf_limit' => $starter->monthly_pdf_limit,
                'is_active' => true,
                'sort_order' => (DB::table('subscription_plans')->max('sort_order') ?? 0) + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('subscription_plans')->where('code', 'TRAINING_PROVIDER')->delete();

        if (Schema::hasColumn('subscription_plan_requests', 'training_provider_company_id')) {
            Schema::table('subscription_plan_requests', fn (Blueprint $table) => $table->dropColumn('training_provider_company_id'));
        }
        if (Schema::hasColumn('subscription_plans', 'audience')) {
            Schema::table('subscription_plans', fn (Blueprint $table) => $table->dropColumn('audience'));
        }
    }
};
