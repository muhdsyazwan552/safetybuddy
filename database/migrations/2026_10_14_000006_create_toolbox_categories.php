<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Toolbox talks use their own CATEGORY list (the ten category groups of the system
 * document). Inspections keep using `toolbox_topic`, so the two no longer share topics.
 * Old talks keep their legacy topics in `toolbox_talks_topics`.
 */
return new class extends Migration
{
    private array $categories = [
        'Workplace Management',
        'Personnel Safety & PPE',
        'Plant & Equipment Safety',
        'High Risk Activities',
        'Electrical Safety',
        'Fire & Emergency Management',
        'Environmental Management',
        'Traffic Management',
        'Communication & Signage',
        'Occupational Health',
    ];

    public function up(): void
    {
        Schema::create('toolbox_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('toolbox_talk_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('toolbox_talk_id')->index();
            $table->unsignedBigInteger('toolbox_category_id')->index();
            $table->timestamps();

            $table->unique(['toolbox_talk_id', 'toolbox_category_id'], 'talk_category_unique');
        });

        foreach ($this->categories as $i => $name) {
            DB::table('toolbox_categories')->insert([
                'name' => $name,
                'sort_order' => $i + 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('toolbox_talk_categories');
        Schema::dropIfExists('toolbox_categories');
    }
};
