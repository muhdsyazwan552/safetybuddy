<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('inspections', 'photo')
            && in_array(Schema::getColumnType('inspections', 'photo'), ['varchar', 'char'], true)) {
            Schema::table('inspections', function (Blueprint $table) {
                $table->text('photo')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Keep existing photo references intact. They may exceed the old column size.
    }
};
