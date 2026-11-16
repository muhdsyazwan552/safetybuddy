<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Extra seats bought on top of a package, once per seat, any package: Inspector RM 1,000, Executor (Subcontractor) RM 1,500. */
class SubscriptionAddon extends Model
{
    public const INSPECTOR_PRICE = 1000;
    public const EXECUTOR_PRICE = 1500;

    protected $table = 'subscription_addons';

    protected $fillable = ['company_id', 'subscription_id', 'type', 'quantity', 'unit_price', 'total_amount', 'payment_id', 'purchased_by'];
}
