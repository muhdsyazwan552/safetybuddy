<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->unsignedInteger('price_yearly');
            $table->unsignedSmallInteger('manager_limit')->default(1);
            $table->unsignedSmallInteger('supervisor_limit')->default(1);
            $table->unsignedSmallInteger('inspector_limit')->default(1);
            $table->unsignedSmallInteger('daily_pdf_limit')->nullable();
            $table->unsignedSmallInteger('monthly_pdf_limit')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('subscription_plan_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('company_id')->index();
            $table->foreignId('plan_id')->constrained('subscription_plans');
            $table->unsignedInteger('price_yearly');
            $table->string('status', 20)->default('pending')->index();
            $table->unsignedInteger('subscription_id')->nullable();
            $table->foreignId('requested_by')->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        $now = now();
        DB::table('subscription_plans')->insert([
            ['code' => 'STARTER', 'name' => 'Starter', 'price_yearly' => 800, 'manager_limit' => 1, 'supervisor_limit' => 1, 'inspector_limit' => 1, 'daily_pdf_limit' => 10, 'monthly_pdf_limit' => 2, 'is_active' => true, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'PROFESSIONAL', 'name' => 'Professional', 'price_yearly' => 1600, 'manager_limit' => 1, 'supervisor_limit' => 1, 'inspector_limit' => 1, 'daily_pdf_limit' => null, 'monthly_pdf_limit' => null, 'is_active' => true, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'ENTERPRISE', 'name' => 'Enterprise', 'price_yearly' => 2400, 'manager_limit' => 1, 'supervisor_limit' => 1, 'inspector_limit' => 2, 'daily_pdf_limit' => null, 'monthly_pdf_limit' => null, 'is_active' => true, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plan_requests');
        Schema::dropIfExists('subscription_plans');
    }
};
