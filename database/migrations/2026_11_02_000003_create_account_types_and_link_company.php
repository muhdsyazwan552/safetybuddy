<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 100);
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();
        DB::table('account_types')->insert([
            ['id' => 1, 'code' => 'NORMAL', 'name' => 'Normal', 'description' => 'Company that buys a standard package directly', 'is_active' => true, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'code' => 'TRAINING_PROVIDER', 'name' => 'Training Provider', 'description' => 'Verified training company with the Training Provider package', 'is_active' => true, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'code' => 'UNDER_TRAINING_PROVIDER', 'name' => 'Under Training Provider', 'description' => 'Company registered using a Training Provider reference code', 'is_active' => true, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
        ]);

        Schema::table('company', function (Blueprint $table) {
            $table->foreignId('account_type_id')->default(1)->constrained('account_types');
            $table->unsignedInteger('training_provider_company_id')->nullable()->index();
        });

        // existing data: providers (own Training Provider subscription) and companies that used a reference code
        $providerIds = DB::table('subscriptions_company')
            ->join('subscription_plans', 'subscription_plans.id', '=', 'subscriptions_company.subscription_plan_id')
            ->where('subscription_plans.audience', 'training_provider')
            ->pluck('subscriptions_company.company_id');
        if ($providerIds->isNotEmpty()) {
            DB::table('company')->whereIn('id', $providerIds)->update(['account_type_id' => 2]);
        }

        DB::table('subscription_plan_requests')
            ->where('status', 'approved')->whereNotNull('training_provider_company_id')
            ->get(['company_id', 'training_provider_company_id'])
            ->each(function ($request) {
                DB::table('company')->where('id', $request->company_id)->where('account_type_id', 1)
                    ->update(['account_type_id' => 3, 'training_provider_company_id' => $request->training_provider_company_id]);
            });
    }

    public function down(): void
    {
        Schema::table('company', function (Blueprint $table) {
            $table->dropForeign(['account_type_id']);
            $table->dropColumn(['account_type_id', 'training_provider_company_id']);
        });
        Schema::dropIfExists('account_types');
    }
};
