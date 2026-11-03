<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenaltySettings extends Model
{
    use HasFactory;

    protected $table = 'penalty_settings';

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