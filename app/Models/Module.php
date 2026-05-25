<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;

    protected $table = 'modules';

    protected $fillable = [
        'code', // Unique code for the module
        'name', // Display name of the module
        'description',
        'price', // if 0.00 then it's free
        'is_active', // Y/N to indicate if the module is active 
        
    ];

    
}
