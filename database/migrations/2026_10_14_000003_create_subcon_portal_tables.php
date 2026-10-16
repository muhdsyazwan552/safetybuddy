<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Safety induction topics a subcontractor company (leader) has acknowledged.
        // A company is active only while every active topic of its owner company is ticked.
        Schema::create('subcon_induction_acks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subcon_company_id');
            $table->unsignedBigInteger('topic_id');
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();

            $table->unique(['subcon_company_id', 'topic_id']);
        });

        // Machinery registered by the subcontractor leader (CF = certificate of fitness)
        Schema::create('subcon_machineries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subcon_company_id')->index();
            $table->string('name');
            $table->string('identifier')->nullable();      // plate / serial no.
            $table->string('cf_file')->nullable();         // attached certificate
            $table->date('cf_expiry')->nullable();
            $table->unsignedBigInteger('operator_id')->nullable(); // subcon_staff.id
            $table->timestamps();
        });

        // Certification records uploaded for a staff member
        Schema::create('subcon_staff_certifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subcon_staff_id')->index();
            $table->string('title');
            $table->date('expiry_date')->nullable();
            $table->string('file');
            $table->string('original_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subcon_staff_certifications');
        Schema::dropIfExists('subcon_machineries');
        Schema::dropIfExists('subcon_induction_acks');
    }
};
