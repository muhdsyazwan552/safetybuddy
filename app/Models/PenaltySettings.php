<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenaltySettings extends Model
{
    use HasFactory;

    protected $table = 'penalty_settings';

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