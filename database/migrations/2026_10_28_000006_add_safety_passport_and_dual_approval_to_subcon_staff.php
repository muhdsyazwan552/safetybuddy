<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subcon_staff', function (Blueprint $t) {
            $t->boolean('is_safetypassport')->default(false)->after('status'); // 1 = all safety passport items ticked at registration
            $t->unsignedBigInteger('supervisor_approved_by')->nullable()->after('is_safetypassport');
            $t->timestamp('supervisor_approved_at')->nullable()->after('supervisor_approved_by');
            $t->unsignedBigInteger('manager_approved_by')->nullable()->after('supervisor_approved_at');
            $t->timestamp('manager_approved_at')->nullable()->after('manager_approved_by');
        });

        // Workers registered before this rule existed are grandfathered in.
        DB::table('subcon_staff')->update(['is_safetypassport' => 1]);
    }

    public function down(): void
    {
        Schema::table('subcon_staff', fn (Blueprint $t) => $t->dropColumn([
            'is_safetypassport', 'supervisor_approved_by', 'supervisor_approved_at', 'manager_approved_by', 'manager_approved_at',
        ]));
    }
};
