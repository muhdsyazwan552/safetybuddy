<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\CheckSubscriptionExpiry;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Runs every day at midnight to check for expired subscriptions
Schedule::command(CheckSubscriptionExpiry::class)->dailyAt('00:00');