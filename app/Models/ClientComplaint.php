<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientComplaint extends Model
{
    use HasFactory;

    protected $table = 'client_complaints';

    protected $fillable = [
        'inspection_id', // FK to inspections table
        'status', // open, close
        'date_open',
        'date_close',
        'review_by', // FK to staff
        'comment',
    ];

    protected $casts = [
        'date_open' => 'date',
        'date_close' => 'date',
    ];

    public function inspection()
    {
        return $this->belongsTo(Inspection::class, 'inspection_id');
    }
}