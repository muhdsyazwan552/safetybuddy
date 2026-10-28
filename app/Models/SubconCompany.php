<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class SubconCompany extends Model
{
    use HasFactory;

    protected $table = 'subcon_company';

    protected $fillable = [
        'name',
        'code',
        'code_prefix',
        'serial_no',
        'email',
        'contact',
        'address',
        'status',
        'company_id',
        'public_token',
        'briefing_approved_at'
    ];

    protected $casts = [
        'briefing_approved_at' => 'datetime',
    ];


    public function projects()
    {
        return $this->belongsToMany(
            Project::class,
            'project_assign',
            'entity_id',    // FK on pivot table for executor
            'project_id'    // FK on pivot table for project
        )
            ->withPivot('role_assignment', 'entity_type')
            ->wherePivot('entity_type', 'subcon') // Only company assignments
            ->using(ProjectAssign::class);
    }

    // Direct relationship with assignments
    public function assignments()
    {
        return $this->hasMany(ProjectAssign::class, 'entity_id')
            ->where('entity_type', 'subcon');
    }

    public function subconStaff()
    {
        return $this->hasMany(SubconStaff::class, 'company_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->public_token = static::generatePublicToken();
        });
    }

    /**
     * Secret that unlocks the *leader* version of the public staff page.
     * Derived from the public token with the app key, so the plain staff link
     * (which only contains the public token) can never be turned into a leader link.
     */
    public function leaderKey(): string
    {
        return static::leaderKeyFor($this->public_token);
    }

    public static function leaderKeyFor(?string $token): string
    {
        return substr(hash_hmac('sha256', 'subcon-leader|' . $token, config('app.key')), 0, 40);
    }

    public function isValidLeaderKey(?string $key): bool
    {
        return is_string($key) && $key !== '' && hash_equals($this->leaderKey(), $key);
    }

    /**
     * Generate a unique public token for the company
     */
    public static function generatePublicToken()
    {
        do {
            $token = Str::random(32);
        } while (SubconCompany::where('public_token', $token)->exists());

        return $token;
    }
}
