<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $table = 'company';

    protected $fillable = [
        'name',
        'code',
        'registration_no',
        'email',
        'address',
        'contact',
        'status',
    ];

    /**
     * Get the users associated with the role.
     */
    public function users()
    {
        return $this->hasOne(User::class);
    }
}
