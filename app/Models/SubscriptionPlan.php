<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = ['code', 'name', 'price_yearly', 'manager_limit', 'supervisor_limit', 'inspector_limit', 'contractor_limit', 'daily_pdf_limit', 'monthly_pdf_limit', 'is_active', 'sort_order'];

    protected $casts = ['is_active' => 'boolean'];
}
