<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'stay_signed_in')) {
            Schema::table('users', function (Blueprint $table) {
                // on by default: the device remembers the user until they sign out or turn this off in Settings
                $table->boolean('stay_signed_in')->default(true);
            });
        }

        if (! Schema::hasColumn('users', 'remember_token')) {
            Schema::table('users', function (Blueprint $table) {
                $table->rememberToken();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'stay_signed_in')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('stay_signed_in');
            });
        }
    }
};
