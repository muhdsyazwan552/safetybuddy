<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            // price a Training Provider pays for a package it buys for a company under it (edit per plan)
            $table->unsignedInteger('provider_price_yearly')->nullable()->after('price_yearly');
        });
        DB::table('subscription_plans')->where('audience', 'normal')->update(['provider_price_yearly' => DB::raw('price_yearly')]);

        Schema::create('package_activation_codes', function (Blueprint $table) {
            $table->id();
            $table->string('batch_ref', 30)->index();
            $table->string('code', 40)->unique();
            $table->unsignedInteger('provider_company_id')->index();
            $table->foreignId('plan_id')->constrained('subscription_plans');
            $table->unsignedInteger('price_yearly');
            // pending (awaiting payment) -> available (paid, code can be given out) -> used; rejected if the order is refused
            $table->string('status', 20)->default('pending')->index();
            $table->foreignId('requested_by')->constrained('users');
            $table->timestamp('paid_at')->nullable();
            $table->unsignedInteger('used_by_company_id')->nullable()->index();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_activation_codes');
        Schema::table('subscription_plans', fn (Blueprint $table) => $table->dropColumn('provider_price_yearly'));
    }
};
