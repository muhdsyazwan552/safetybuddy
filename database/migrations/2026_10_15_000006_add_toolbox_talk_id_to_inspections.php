<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // inspections done in the same site visit as a toolbox talk point back to that talk
        Schema::table('inspections', function (Blueprint $table) {
            $table->unsignedBigInteger('toolbox_talk_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropColumn('toolbox_talk_id');
        });
    }
};
