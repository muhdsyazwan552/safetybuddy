<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Subcontractor staff involved in an incident
        Schema::create('incident_staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('incident_id');
            $table->unsignedBigInteger('subcon_staff_id');
            $table->timestamps();

            $table->unique(['incident_id', 'subcon_staff_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_staff');
    }
};
