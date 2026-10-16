<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Safety Passport sampling recorded with a toolbox talk:
     *   sp_sampled         total workers sampled
     *   sp_not_registered  workers sampled that are not registered for the project
     * Compliance % = (sampled - not registered) / sampled x 100  (calculated, not stored)
     */
    public function up(): void
    {
        Schema::table('toolbox_talks', function (Blueprint $table) {
            if (!Schema::hasColumn('toolbox_talks', 'sp_sampled')) {
                $table->unsignedInteger('sp_sampled')->nullable();
            }
            if (!Schema::hasColumn('toolbox_talks', 'sp_not_registered')) {
                $table->unsignedInteger('sp_not_registered')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('toolbox_talks', function (Blueprint $table) {
            $table->dropColumn(['sp_sampled', 'sp_not_registered']);
        });
    }
};
