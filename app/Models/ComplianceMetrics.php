<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplianceMetrics extends Model
{
    use HasFactory;

    protected $table = 'compliance_metrics';


    /** A signed-in company only ever sees its own rows. */

    protected static function booted(): void

    {

        static::addGlobalScope(new \App\Models\Scopes\TenantScope());
        static::saving(fn ($model) => \App\Models\Scopes\TenantScope::guardWrite($model));

    }

    protected $fillable = [
        'title',
        'description',
        'company_id',
        'percent',
        'value',
    ];

    /**
     * Get the users associated with the role.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }
}