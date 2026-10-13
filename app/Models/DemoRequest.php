<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemoRequest extends Model
{
    protected $fillable = [
        'name', 'email', 'phone', 'company', 'projects',
        'preferred_date', 'interests', 'message', 'status',
    ];

    protected $casts = [
        'interests' => 'array',
        'preferred_date' => 'date',
    ];
}
