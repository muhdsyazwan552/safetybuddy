<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_provider_applications', function (Blueprint $table) {
            $table->string('company_name', 150)->nullable()->after('plan_id');
            $table->string('owner_name', 150)->nullable()->after('registration_no');
            $table->string('email', 150)->nullable()->after('owner_name');
        });
    }

    public function down(): void
    {
        Schema::table('training_provider_applications', fn (Blueprint $table) => $table->dropColumn(['company_name', 'owner_name', 'email']));
    }
};
