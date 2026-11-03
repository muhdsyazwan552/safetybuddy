<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_provider_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('company_id')->index();
            $table->foreignId('plan_id')->constrained('subscription_plans');
            $table->string('registration_no', 100);
            $table->string('registration_document');
            $table->string('status', 20)->default('pending')->index();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('requested_by')->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('training_provider_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('training_provider_applications')->cascadeOnDelete();
            $table->string('issuing_body', 150);
            $table->date('expiry_date');
            $table->string('file_path');
            $table->string('file_name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_provider_certificates');
        Schema::dropIfExists('training_provider_applications');
    }
};
