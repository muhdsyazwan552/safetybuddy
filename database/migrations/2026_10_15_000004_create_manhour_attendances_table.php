<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per subcontractor staff ticked present on a day. manhours keeps the daily total.
        Schema::create('manhour_attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('subcon_company_id');
            $table->unsignedBigInteger('subcon_staff_id');
            $table->date('work_date');
            $table->decimal('hours', 5, 2)->default(8);
            $table->timestamps();

            $table->unique(['project_id', 'subcon_staff_id', 'work_date'], 'manhour_attendance_unique');
            $table->index(['project_id', 'subcon_company_id', 'work_date'], 'manhour_attendance_day');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manhour_attendances');
    }
};
