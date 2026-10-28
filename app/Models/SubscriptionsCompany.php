<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionsCompany extends Model
{
    use HasFactory;

    protected $table = 'subscriptions_company';

    protected $fillable = [
        'company_id', // FK to companies table
        'module_id', // FK to modules table
        'subscription_plan_id',
        'start_date',
        'end_date',
        'status', // active, expired, cancelled
        'type', // new, renew
        'serial_no',
        'code',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function module()
    {
        return $this->belongsTo(Module::class, 'module_id');
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

}
