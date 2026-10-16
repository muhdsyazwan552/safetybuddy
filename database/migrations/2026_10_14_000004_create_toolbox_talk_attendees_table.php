<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Who attended a toolbox talk. `toolbox_talks.total_attended` is now the number of
     * rows here, so nobody has to type the attendance number any more.
     */
    public function up(): void
    {
        Schema::create('toolbox_talk_attendees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('toolbox_talk_id')->index();
            $table->unsignedBigInteger('subcon_staff_id')->index();
            $table->timestamps();

            $table->unique(['toolbox_talk_id', 'subcon_staff_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('toolbox_talk_attendees');
    }
};
