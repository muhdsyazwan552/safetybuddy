<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('project_assign', 'notes')) {
            Schema::table('project_assign', function (Blueprint $table) {
                $table->text('notes')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('project_assign', 'notes')) {
            Schema::table('project_assign', function (Blueprint $table) {
                $table->dropColumn('notes');
            });
        }
    }
};
