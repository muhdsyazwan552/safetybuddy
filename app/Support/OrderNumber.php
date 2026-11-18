<?php

namespace App\Support;

use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\DB;

/**
 * Order numbers: SB-{package}-{YYMM}-{running number}, e.g. SB-EP-2611-001.
 * The running number restarts at 001 for each package every month.
 */
class OrderNumber
{
    /** Two-letter package codes used in order numbers. */
    private const PLAN_CODES = [
        'STARTER' => 'ST',
        'PROFESSIONAL' => 'PF',
        'ENTERPRISE' => 'EP',
        'TRAINING_PROVIDER' => 'TP',
        'CONTRACTOR_TRAINING_PROVIDER' => 'PT', // the Participant package
    ];

    public const INSPECTOR_SLOT = 'IS';
    public const CONTRACTOR_SLOT = 'CS';
    public const PARTICIPANT_RENEWAL = 'PR';

    public static function planCode(?SubscriptionPlan $plan): string
    {
        $code = (string) $plan?->code;

        return self::PLAN_CODES[$code] ?? strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $code) ?: 'OR', 0, 2));
    }

    public static function next(string $package): string
    {
        $package = strtoupper($package);
        $period = now()->format('ym');
        $key = "{$package}-{$period}";

        return DB::transaction(function () use ($package, $period, $key) {
            $row = DB::table('order_sequences')->where('name', $key)->lockForUpdate()->first();
            if (! $row) {
                DB::table('order_sequences')->insertOrIgnore(['name' => $key, 'last_number' => 0]);
                $row = DB::table('order_sequences')->where('name', $key)->lockForUpdate()->first();
            }
            $number = $row->last_number + 1;
            DB::table('order_sequences')->where('name', $key)->update(['last_number' => $number]);

            return "SB-{$package}-{$period}-".str_pad((string) $number, 3, '0', STR_PAD_LEFT);
        });
    }
}
