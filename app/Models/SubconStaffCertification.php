<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubconStaffCertification extends Model
{
    protected $table = 'subcon_staff_certifications';

    protected $fillable = [
        'subcon_staff_id', 'title', 'expiry_date', 'file', 'original_name',
    ];

    protected $casts = [
        'expiry_date' => 'date',
    ];
}
