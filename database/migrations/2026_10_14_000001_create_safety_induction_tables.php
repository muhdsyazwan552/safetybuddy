<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per induction topic (Appendix A has 13 default topics per company)
        Schema::create('safety_induction_topics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedTinyInteger('default_key')->nullable(); // 1..13 = original Appendix A topic
            $table->string('title');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_customised')->default(false);
            $table->timestamps();
        });

        // Content blocks inside a topic: paragraph | subheading | bullet | highlight
        Schema::create('safety_induction_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('topic_id')->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('type', 20)->default('bullet');
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('safety_induction_items');
        Schema::dropIfExists('safety_induction_topics');
    }
};
