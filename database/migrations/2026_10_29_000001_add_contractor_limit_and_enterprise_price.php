<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('subscription_plans', 'contractor_limit')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->unsignedSmallInteger('contractor_limit')->default(1)->after('inspector_limit');
            });
        }

        DB::table('subscription_plans')
            ->where('code', 'ENTERPRISE')
            ->where('price_yearly', 2400)
            ->update(['price_yearly' => 2500, 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('subscription_plans')
            ->where('code', 'ENTERPRISE')
            ->where('price_yearly', 2500)
            ->update(['price_yearly' => 2400, 'updated_at' => now()]);

        if (Schema::hasColumn('subscription_plans', 'contractor_limit')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->dropColumn('contractor_limit');
            });
        }
    }
};
