<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplianceMetrics extends Model
{
    use HasFactory;

    protected $table = 'compliance_metrics';

    protected $fillable = [
        'title',
        'description',
        'company_id',
        'percent',
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