<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $table = 'company';

    /** Every company gets a random uuid once; it is the public identifier, so ids cannot be guessed or counted. */
    protected static function booted(): void
    {
        static::creating(function (self $company) {
            $company->uuid ??= (string) \Illuminate\Support\Str::uuid();
        });
    }

    protected $fillable = [
        'uuid',
        'name',
        'code',
        'reference_code',
        'registration_no',
        'email',
        'address',
        'city',
        'postcode',
        'state',
        'latitude',
        'longitude',
        'contact',
        'logo_path',
        'status',
        'account_type_id',
        'training_provider_company_id',
        'provider_linked_at',
    ];

    protected $casts = [
        'provider_linked_at' => 'datetime',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path ? '/storage/'.$this->logo_path : null;
    }

    /** Issue the Training Provider reference code once (called when payment is confirmed). */
    public function ensureReferenceCode(): string
    {
        if ($this->reference_code) {
            return $this->reference_code;
        }

        // series follows the provider's company code, e.g. SBT-4K9Q-2MXH-7WRD
        $prefix = $this->code ?: \App\Support\SeriesCodes::prefix($this->name);
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
        } while (self::where('reference_code', $code)->exists());

        $this->forceFill(['reference_code' => $code])->save();

        return $code;
    }

    public function accountType()
    {
        return $this->belongsTo(AccountType::class, 'account_type_id');
    }

    public function trainingProvider()
    {
        return $this->belongsTo(self::class, 'training_provider_company_id');
    }

    public function trainees()
    {
        return $this->hasMany(self::class, 'training_provider_company_id');
    }

    /**
     * Get the users associated with the role.
     */
    public function subscriptions()
    {
        return $this->hasMany(SubscriptionsCompany::class, 'company_id');
    }

    public function users()
    {
        return $this->hasOne(User::class);
    }
}
