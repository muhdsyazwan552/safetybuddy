<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // same review flow as inspections: pending_verification -> verified -> approved (or rejected)
        Schema::table('toolbox_talks', function (Blueprint $table) {
            $table->string('status', 30)->default('pending_verification')->index();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('review_comment')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('toolbox_talks', function (Blueprint $table) {
            $table->dropColumn(['status', 'verified_by', 'verified_at', 'approved_by', 'approved_at', 'review_comment']);
        });
    }
};
