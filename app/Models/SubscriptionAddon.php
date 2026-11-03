<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Extra seats bought on top of a package, once per seat, any package: Inspector RM 800, Executor RM 500. */
class SubscriptionAddon extends Model
{
    public const INSPECTOR_PRICE = 800;
    public const EXECUTOR_PRICE = 500;

    protected $table = 'subscription_addons';

    protected $fillable = ['company_id', 'subscription_id', 'type', 'quantity', 'unit_price', 'total_amount', 'payment_id', 'purchased_by'];
}
