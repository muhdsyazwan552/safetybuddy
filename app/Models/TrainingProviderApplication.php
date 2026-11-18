<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingProviderApplication extends Model
{
    protected $fillable = ['company_id', 'plan_id', 'company_name', 'owner_name', 'email', 'registration_no', 'registration_document', 'status', 'rejection_reason', 'requested_by', 'reviewed_at'];

    protected $casts = ['reviewed_at' => 'datetime'];

    public function certificates()
    {
        return $this->hasMany(TrainingProviderCertificate::class, 'application_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }
}
