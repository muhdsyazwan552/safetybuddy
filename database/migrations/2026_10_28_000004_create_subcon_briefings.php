<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One submission = the signed Worker Acknowledgement Register + briefing photos for a batch of workers.
        Schema::create('subcon_briefing_submissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subcon_company_id')->index();
            $table->string('status', 20)->default('pending'); // pending | approved | returned
            $table->date('briefing_date');
            $table->string('register_file');
            $table->string('register_name')->nullable();
            $table->text('photos')->nullable();                // json list of image paths
            $table->text('notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable(); // company_staff.id
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_comment')->nullable();
            $table->timestamps();
        });

        Schema::create('subcon_briefing_workers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('submission_id')->index();
            $table->unsignedBigInteger('subcon_staff_id')->index();
            $table->unique(['submission_id', 'subcon_staff_id']);
        });

        // Worker status: pending -> submitted (evidence sent) -> done (approved)
        Schema::table('subcon_staff', function (Blueprint $table) {
            $table->string('sp_briefing_status', 20)->default('pending');
            $table->date('sp_briefing_date')->nullable();
        });

        // The company becomes ACTIVE only after its first briefing evidence is approved.
        Schema::table('subcon_company', function (Blueprint $table) {
            $table->timestamp('briefing_approved_at')->nullable();
        });

        // Companies that are already active keep working: grandfather them in.
        DB::table('subcon_company')->whereRaw('LOWER(status) = ?', ['active'])->update(['briefing_approved_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('subcon_company', fn (Blueprint $t) => $t->dropColumn('briefing_approved_at'));
        Schema::table('subcon_staff', fn (Blueprint $t) => $t->dropColumn(['sp_briefing_status', 'sp_briefing_date']));
        Schema::dropIfExists('subcon_briefing_workers');
        Schema::dropIfExists('subcon_briefing_submissions');
    }
};
