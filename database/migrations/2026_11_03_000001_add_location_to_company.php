<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // structured address + coordinates (worked out from the address when the company saves it)
        Schema::table('company', function (Blueprint $table) {
            $table->string('city', 100)->nullable()->after('address');
            $table->string('postcode', 10)->nullable()->after('city');
            $table->string('state', 50)->nullable()->after('postcode')->index();
            $table->decimal('latitude', 10, 7)->nullable()->after('state');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('company', function (Blueprint $table) {
            $table->dropIndex(['state']);
            $table->dropColumn(['city', 'postcode', 'state', 'latitude', 'longitude']);
        });
    }
};
