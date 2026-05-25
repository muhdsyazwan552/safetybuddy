<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SubscriptionsCompany;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CheckSubscriptionExpiry extends Command
{
    protected $signature   = 'subscriptions:check-expiry';
    protected $description = 'Auto-expire subscriptions where end_date has passed';

    public function handle()
    {
        $expired = SubscriptionsCompany::where('status', 'active')
            ->where('end_date', '<', Carbon::today())
            ->update([
                'status'     => 'expired',
                'updated_at' => now(),
            ]);

        Log::info("[SubscriptionExpiry] {$expired} subscription(s) marked as expired.");
        $this->info("{$expired} subscription(s) marked as expired.");
    }
}