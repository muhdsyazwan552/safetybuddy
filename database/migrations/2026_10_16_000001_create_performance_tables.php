<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SPGPNC / BSPR settings of a company (benchmarks, penalty amounts, ranking, switches)
        Schema::create('performance_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->unique();
            $table->decimal('sp_benchmark', 6, 2)->default(100);
            $table->decimal('g_benchmark', 6, 2)->default(80);
            $table->decimal('p_benchmark', 6, 2)->default(80);
            $table->decimal('sp_penalty', 10, 2)->default(300);
            $table->decimal('g_penalty', 10, 2)->default(300);
            $table->decimal('p_penalty', 10, 2)->default(300);
            $table->decimal('nc_penalty', 10, 2)->default(100);
            $table->decimal('cc_penalty', 10, 2)->default(500);
            $table->decimal('gold_min', 6, 2)->default(90);
            $table->decimal('silver_min', 6, 2)->default(60);
            $table->boolean('scoring_on')->default(true);
            $table->boolean('bspr_on')->default(true);
            $table->boolean('penalties_on')->default(true);
            $table->timestamps();
        });

        // Safety Passport sampling of a toolbox talk, per subcontractor
        Schema::create('toolbox_talk_sp', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('toolbox_talk_id');
            $table->unsignedBigInteger('subcon_company_id');
            $table->unsignedInteger('sampled')->default(0);
            $table->unsignedInteger('not_registered')->default(0);
            $table->timestamps();

            $table->unique(['toolbox_talk_id', 'subcon_company_id']);
        });

        // Daily inspection report: one per project / subcontractor / day
        Schema::create('inspection_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('subcon_company_id');
            $table->date('report_date');
            $table->string('report_no', 60);
            $table->string('status', 30)->default('pending_verification');

            $table->unsignedInteger('sp_sampled')->nullable();
            $table->unsignedInteger('sp_not_registered')->nullable();
            $table->unsignedInteger('good')->default(0);
            $table->unsignedInteger('poor')->default(0);
            $table->unsignedInteger('nc')->default(0);
            $table->unsignedInteger('cc')->default(0);
            $table->unsignedInteger('total')->default(0);

            $table->decimal('sp_score', 9, 4)->nullable();
            $table->decimal('g_score', 9, 4)->nullable();
            $table->decimal('p_score', 9, 4)->nullable();
            $table->decimal('n_score', 9, 4)->nullable();
            $table->decimal('c_score', 9, 4)->nullable();
            $table->decimal('spgpnc', 9, 4)->nullable();
            $table->string('rank', 10)->nullable();

            $table->decimal('penalty_sp', 10, 2)->default(0);
            $table->decimal('penalty_g', 10, 2)->default(0);
            $table->decimal('penalty_p', 10, 2)->default(0);
            $table->decimal('penalty_nc', 10, 2)->default(0);
            $table->decimal('penalty_cc', 10, 2)->default(0);
            $table->decimal('penalty_total', 10, 2)->default(0);
            $table->string('penalty_status', 20)->default('pending_review'); // pending_review | confirmed | waived
            $table->unsignedBigInteger('penalty_reviewed_by')->nullable();
            $table->timestamp('penalty_reviewed_at')->nullable();

            $table->json('settings_snapshot')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'subcon_company_id', 'report_date'], 'inspection_report_day');
        });

        // Monthly report: pooled counts of the approved daily reports of a project / subcontractor
        Schema::create('monthly_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('subcon_company_id');
            $table->char('period', 7); // YYYY-MM
            $table->string('report_no', 60);
            $table->string('status', 30)->default('pending_verification'); // pending_verification | verified | approved | rejected

            $table->unsignedInteger('inspections_total')->default(0);    // daily reports in the month
            $table->unsignedInteger('inspections_approved')->default(0);
            $table->unsignedInteger('sp_assessed')->default(0);          // approved reports with SP data
            $table->unsignedInteger('sp_observations')->default(0);
            $table->unsignedInteger('sp_compliant')->default(0);
            $table->unsignedInteger('good')->default(0);
            $table->unsignedInteger('poor')->default(0);
            $table->unsignedInteger('nc')->default(0);
            $table->unsignedInteger('cc')->default(0);
            $table->unsignedInteger('total')->default(0);

            $table->decimal('sp_score', 9, 4)->nullable();
            $table->decimal('g_score', 9, 4)->nullable();
            $table->decimal('p_score', 9, 4)->nullable();
            $table->decimal('n_score', 9, 4)->nullable();
            $table->decimal('c_score', 9, 4)->nullable();
            $table->decimal('spgpnc', 9, 4)->nullable();
            $table->string('rank', 10)->nullable();

            // penalty = sum of the inspection-level amounts, broken down per rule
            $table->unsignedInteger('sp_below')->default(0);
            $table->unsignedInteger('g_below')->default(0);
            $table->unsignedInteger('p_below')->default(0);
            $table->decimal('penalty_sp', 10, 2)->default(0);
            $table->decimal('penalty_g', 10, 2)->default(0);
            $table->decimal('penalty_p', 10, 2)->default(0);
            $table->decimal('penalty_nc', 10, 2)->default(0);
            $table->decimal('penalty_cc', 10, 2)->default(0);
            $table->decimal('penalty_total', 10, 2)->default(0);

            $table->json('settings_snapshot')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('review_comment')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'subcon_company_id', 'period'], 'monthly_report_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_reports');
        Schema::dropIfExists('inspection_reports');
        Schema::dropIfExists('toolbox_talk_sp');
        Schema::dropIfExists('performance_settings');
    }
};
