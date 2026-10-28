<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Extra seats a company bought on top of its package (one-time fee, no approval needed)
        Schema::create('subscription_addons', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('company_id')->index();
            $table->unsignedInteger('subscription_id')->nullable();
            $table->string('type', 30)->default('inspector');
            $table->unsignedSmallInteger('quantity');
            $table->unsignedInteger('unit_price');
            $table->unsignedInteger('total_amount');
            $table->unsignedInteger('payment_id')->nullable();
            $table->unsignedBigInteger('purchased_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_addons');
    }
};
