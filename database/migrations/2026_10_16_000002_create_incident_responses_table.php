<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Supervisor / Manager responses and the closing remark of an incident
        Schema::create('incident_responses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('incident_id')->index();
            $table->unsignedBigInteger('staff_id')->nullable();
            $table->string('staff_name', 150)->nullable();
            $table->string('role_label', 40)->nullable();
            $table->string('type', 20)->default('response'); // response | closed | reopened
            $table->text('message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_responses');
    }
};
