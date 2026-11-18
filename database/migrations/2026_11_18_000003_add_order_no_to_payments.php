<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('order_no', 30)->nullable()->index();
        });

        // link payments of activation-code orders approved before this column existed
        foreach (DB::table('package_activation_codes')->whereIn('status', ['available', 'used'])->select('batch_ref', 'provider_company_id')->distinct()->get() as $batch) {
            $total = DB::table('package_activation_codes')->where('batch_ref', $batch->batch_ref)->sum('price_yearly');
            $paidAt = DB::table('package_activation_codes')->where('batch_ref', $batch->batch_ref)->min('paid_at');
            $payment = DB::table('payments')->where('company_id', $batch->provider_company_id)->where('payment_type', 'activation_code_order')
                ->whereNull('order_no')->where('total_amount', $total)
                ->orderByRaw('ABS(TIMESTAMPDIFF(SECOND, created_at, ?))', [$paidAt ?? now()])->first();
            if ($payment) {
                DB::table('payments')->where('id', $payment->id)->update(['order_no' => $batch->batch_ref]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('payments', fn (Blueprint $table) => $table->dropColumn('order_no'));
    }
};
