<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlanRequest extends Model
{
    protected $fillable = ['company_id', 'plan_id', 'price_yearly', 'status', 'subscription_id', 'requested_by', 'reviewed_at'];

    protected $casts = ['reviewed_at' => 'datetime'];

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
