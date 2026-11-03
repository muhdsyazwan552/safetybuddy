<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('package_activation_codes', 'renewal_for_company_id')) {
            return;
        }

        Schema::table('package_activation_codes', function (Blueprint $table) {
            // set when a Training Provider buys a renewal for one of its companies: only that company can use the code
            $table->unsignedInteger('renewal_for_company_id')->nullable()->after('provider_company_id')->index();
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('package_activation_codes', 'renewal_for_company_id')) {
            Schema::table('package_activation_codes', function (Blueprint $table) {
                $table->dropIndex(['renewal_for_company_id']);
                $table->dropColumn('renewal_for_company_id');
            });
        }
    }
};
