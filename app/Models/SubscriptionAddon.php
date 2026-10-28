<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Extra Inspector seats bought on top of a package: RM 800 once per user, any package. */
class SubscriptionAddon extends Model
{
    public const INSPECTOR_PRICE = 800;

    protected $table = 'subscription_addons';

    protected $fillable = ['company_id', 'subscription_id', 'type', 'quantity', 'unit_price', 'total_amount', 'payment_id', 'purchased_by'];
}
