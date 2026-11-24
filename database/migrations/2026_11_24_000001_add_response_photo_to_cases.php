<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['non_conformances', 'client_complaints'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->string('response_photo')->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['non_conformances', 'client_complaints'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropColumn('response_photo');
            });
        }
    }
};
