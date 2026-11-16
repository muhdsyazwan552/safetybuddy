<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** A deactivated employee keeps every record but can no longer sign in. Nobody can reactivate the account. */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'deactivated_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('deactivated_at')->nullable();
            });
        }

        // staff already marked inactive keep that state at login level too
        $userIds = DB::table('company_staff')->where('status', 'inactive')->whereNotNull('user_id')->pluck('user_id');
        if ($userIds->isNotEmpty()) {
            DB::table('users')->whereIn('id', $userIds)->whereNotIn('role_id', [1, 2])->update(['deactivated_at' => now()]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'deactivated_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('deactivated_at');
            });
        }
    }
};
