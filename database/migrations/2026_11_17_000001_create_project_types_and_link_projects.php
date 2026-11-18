<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Default project types. Add, rename or reorder them directly in the project_types table. */
    private const DEFAULTS = [
        ['building', 'Building'],
        ['infrastructure', 'Infrastructure'],
        ['industrial', 'Industrial'],
        ['renovation', 'Renovation'],
        ['maintenance', 'Maintenance'],
        ['other', 'Other'],
    ];

    public function up(): void
    {
        Schema::create('project_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        foreach (self::DEFAULTS as $i => [$code, $name]) {
            DB::table('project_types')->insert([
                'code' => $code, 'name' => $name, 'sort_order' => $i + 1,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedBigInteger('project_type_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('project_type_id');
        });
        Schema::dropIfExists('project_types');
    }
};
