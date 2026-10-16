<?php

use App\Support\InspectionCatalogue;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Inspection items live in toolbox_topic (inspections.topic_inspection_id points there).
        Schema::table('toolbox_topic', function (Blueprint $table) {
            $table->unsignedBigInteger('inspection_category_id')->nullable()->index();
            $table->string('code', 10)->nullable()->unique();
        });

        $now = now();
        $ids = [];
        $order = 0;
        foreach (InspectionCatalogue::CATEGORIES as $code => $name) {
            $ids[$code] = DB::table('inspection_categories')->insertGetId([
                'code' => $code, 'name' => $name, 'sort_order' => ++$order,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        foreach (InspectionCatalogue::ITEMS as [$cat, $code, $name]) {
            DB::table('toolbox_topic')->insert([
                'name' => $name,
                'description' => null,
                'code' => $code,
                'inspection_category_id' => $ids[$cat],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('toolbox_topic')->whereNotNull('code')->delete();
        Schema::table('toolbox_topic', function (Blueprint $table) {
            $table->dropColumn(['inspection_category_id', 'code']);
        });
        Schema::dropIfExists('inspection_categories');
    }
};
