<?php

namespace App\Models;

use App\Models\Concerns\HasSeriesCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientComplaint extends Model
{
    use HasFactory, HasSeriesCode;

    public static function seriesType(): string
    {
        return 'cc';
    }

    protected $table = 'client_complaints';

    protected $fillable = [
        'inspection_id', // FK to inspections table
        'status', // open, close
        'date_open',
        'date_close',
        'review_by', // FK to staff
        'comment',
        'subcon_response',
        'responded_at',
        'responded_by',
        'return_reason',
    ];

    protected $casts = [
        'date_open' => 'date',
        'date_close' => 'date',
        'responded_at' => 'datetime',
    ];

    public function inspection()
    {
        return $this->belongsTo(Inspection::class, 'inspection_id');
    }
}