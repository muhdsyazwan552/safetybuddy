<?php

use App\Support\OrderNumber;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_sequences', function (Blueprint $table) {
            $table->string('name')->primary();
            $table->unsignedBigInteger('last_number')->default(0);
        });

        foreach (['subscription_plan_requests', 'subscription_addons'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('order_no', 20)->nullable()->unique();
            });
            foreach (DB::table($tableName)->orderBy('id')->pluck('id') as $id) {
                DB::table($tableName)->where('id', $id)->update(['order_no' => OrderNumber::next()]);
            }
        }
    }

    public function down(): void
    {
        foreach (['subscription_plan_requests', 'subscription_addons'] as $tableName) {
            Schema::table($tableName, fn (Blueprint $table) => $table->dropColumn('order_no'));
        }
        Schema::dropIfExists('order_sequences');
    }
};
