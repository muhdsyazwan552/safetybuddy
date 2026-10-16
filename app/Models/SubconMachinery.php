<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubconMachinery extends Model
{
    protected $table = 'subcon_machineries';

    protected $fillable = [
        'subcon_company_id', 'name', 'identifier', 'cf_file', 'cf_expiry', 'operator_id',
    ];

    protected $casts = [
        'cf_expiry' => 'date',
    ];
}
