<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PackageActivationCode extends Model
{
    protected $fillable = ['batch_ref', 'code', 'provider_company_id', 'renewal_for_company_id', 'plan_id', 'price_yearly', 'status', 'requested_by', 'paid_at', 'used_by_company_id', 'used_at'];

    protected $casts = ['paid_at' => 'datetime', 'used_at' => 'datetime'];

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function provider()
    {
        return $this->belongsTo(Company::class, 'provider_company_id');
    }

    public function renewalFor()
    {
        return $this->belongsTo(Company::class, 'renewal_for_company_id');
    }

    public function usedBy()
    {
        return $this->belongsTo(Company::class, 'used_by_company_id');
    }

    /** Series follows the provider's company code: SBT-PK-XXXX-XXXX-XXXX */
    public static function generateCode(Company $provider): string
    {
        $prefix = ($provider->code ?: \App\Support\SeriesCodes::prefix($provider->name)).'-PK';
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $groups = [];
            for ($group = 0; $group < 3; $group++) {
                $chunk = '';
                for ($i = 0; $i < 4; $i++) {
                    $chunk .= $alphabet[random_int(0, strlen($alphabet) - 1)];
                }
                $groups[] = $chunk;
            }
            $code = $prefix.'-'.implode('-', $groups);
        } while (self::where('code', $code)->exists());

        return $code;
    }
}
