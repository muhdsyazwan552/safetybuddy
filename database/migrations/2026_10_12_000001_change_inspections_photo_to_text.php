<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Inspections can hold several photos (stored as a JSON list of paths),
     * which does not fit in a varchar(255).
     */
    public function up(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->text('photo')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->string('photo')->nullable()->change();
        });
    }
};
