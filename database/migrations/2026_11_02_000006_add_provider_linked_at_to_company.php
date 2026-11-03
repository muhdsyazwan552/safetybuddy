<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company', function (Blueprint $table) {
            // when the company entered its Training Provider's reference code
            $table->timestamp('provider_linked_at')->nullable()->after('training_provider_company_id');
        });

        DB::table('company')->whereNotNull('training_provider_company_id')->whereNull('provider_linked_at')
            ->update(['provider_linked_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('company', fn (Blueprint $table) => $table->dropColumn('provider_linked_at'));
    }
};
