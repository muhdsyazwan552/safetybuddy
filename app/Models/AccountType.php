<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountType extends Model
{
    public const NORMAL = 1;
    public const TRAINING_PROVIDER = 2;
    public const UNDER_TRAINING_PROVIDER = 3;

    protected $fillable = ['code', 'name', 'description', 'is_active', 'sort_order'];

    protected $casts = ['is_active' => 'boolean'];
}
