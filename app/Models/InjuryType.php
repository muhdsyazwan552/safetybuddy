<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InjuryType extends Model
{
    use HasFactory;

    protected $table = 'injury_types';

    protected $fillable = [
    'name',
    'description',
    ];

  

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function incidents()
    {
        return $this->hasOne(Incident::class, 'injury_id');
    }

    
}