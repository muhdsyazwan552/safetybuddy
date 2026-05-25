<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payments extends Model
{
    use HasFactory;

    protected $table = 'payments';

    protected $fillable = [
        'subscriber_type', // company or personal
        'subscriber_id', // FK to subscribers table
        'subscription_id', // FK to subscriptions table to link to the subscription details
        'total_amount',
        'payment_type', // e.g., credit_card, paypal, etc.
        'payment_status', // pending, completed, failed
        'cash_flow', // cash_in or cash_out
        'company_id', // FK to companies table for company payments
    ];

    

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    
    public function subscription()
    {
        return $this->belongsTo(SubscriptionsCompany::class, 'subscription_id');
    }

    

}
