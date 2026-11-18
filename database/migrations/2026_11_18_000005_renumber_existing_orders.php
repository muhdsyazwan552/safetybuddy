<?php

use App\Support\OrderNumber;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** Gives every order placed before the SB-{package}-{YYMM}-{no} format its number in the new format, in the order it was placed. */
return new class extends Migration
{
    private const NEW_FORMAT = '/^SB-[A-Z]{2}-\d{4}-\d{3}$/';

    public function up(): void
    {
        DB::transaction(function () {
            $planCodes = DB::table('subscription_plans')->pluck('code', 'id');
            $planCode = fn ($planId) => OrderNumber::planCode(new \App\Models\SubscriptionPlan(['code' => $planCodes[$planId] ?? '']));

            $items = collect();
            foreach (DB::table('subscription_plan_requests')->get(['id', 'order_no', 'plan_id', 'created_at']) as $row) {
                $items->push(['kind' => 'plan', 'ref' => $row->id, 'old' => $row->order_no, 'code' => $planCode($row->plan_id), 'at' => $row->created_at]);
            }
            foreach (DB::table('subscription_addons')->get(['id', 'order_no', 'type', 'created_at']) as $row) {
                $items->push(['kind' => 'addon', 'ref' => $row->id, 'old' => $row->order_no, 'code' => $row->type === 'executor' ? OrderNumber::CONTRACTOR_SLOT : OrderNumber::INSPECTOR_SLOT, 'at' => $row->created_at]);
            }
            foreach (DB::table('package_activation_codes')->get(['batch_ref', 'plan_id', 'renewal_for_company_id', 'created_at'])->groupBy('batch_ref') as $batch => $codes) {
                $first = $codes->sortBy('created_at')->first();
                $items->push(['kind' => 'batch', 'ref' => $batch, 'old' => $batch, 'code' => $first->renewal_for_company_id ? OrderNumber::PARTICIPANT_RENEWAL : $planCode($first->plan_id), 'at' => $first->created_at]);
            }

            // continue after any number already issued in the new format
            $counters = [];
            foreach ($items as $item) {
                if (preg_match(self::NEW_FORMAT, (string) $item['old'])) {
                    [, $code, $period, $no] = explode('-', $item['old']);
                    $counters["{$code}-{$period}"] = max($counters["{$code}-{$period}"] ?? 0, (int) $no);
                }
            }

            foreach ($items->filter(fn ($item) => ! preg_match(self::NEW_FORMAT, (string) $item['old']))->sortBy(fn ($item) => $item['at'].'|'.str_pad((string) $item['ref'], 10, '0', STR_PAD_LEFT)) as $item) {
                $key = $item['code'].'-'.date('ym', strtotime($item['at']));
                $counters[$key] = ($counters[$key] ?? 0) + 1;
                $new = 'SB-'.$item['code'].'-'.date('ym', strtotime($item['at'])).'-'.str_pad((string) $counters[$key], 3, '0', STR_PAD_LEFT);

                match ($item['kind']) {
                    'plan' => DB::table('subscription_plan_requests')->where('id', $item['ref'])->update(['order_no' => $new]),
                    'addon' => DB::table('subscription_addons')->where('id', $item['ref'])->update(['order_no' => $new]),
                    'batch' => (function () use ($item, $new) {
                        DB::table('package_activation_codes')->where('batch_ref', $item['ref'])->update(['batch_ref' => $new]);
                        DB::table('payments')->where('order_no', $item['ref'])->update(['order_no' => $new]);
                    })(),
                };
            }

            // sequences now continue after the highest number per package and month
            DB::table('order_sequences')->delete();
            foreach ($counters as $key => $last) {
                DB::table('order_sequences')->insert(['name' => $key, 'last_number' => $last]);
            }
        });
    }

    public function down(): void
    {
        // old numbers are not kept; nothing to restore
    }
};
