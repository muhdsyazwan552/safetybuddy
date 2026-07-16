<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manhours', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('subcon_company_id');
            $table->date('work_date');
            $table->unsignedInteger('worker_count');
            $table->decimal('working_hours', 5, 2);
            $table->timestamps();

            $table->unique(['project_id', 'subcon_company_id', 'work_date'], 'manhours_daily_entry_unique');
            $table->index(['company_id', 'work_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manhours');
    }
};
