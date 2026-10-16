<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Daily inspection report of one subcontractor on one project and day. */
class InspectionReport extends Model
{
    protected $table = 'inspection_reports';

    protected $guarded = ['id'];

    protected $casts = [
        'report_date' => 'date:Y-m-d',
        'settings_snapshot' => 'array',
        'penalty_reviewed_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function subcontractor()
    {
        return $this->belongsTo(SubconCompany::class, 'subcon_company_id');
    }
}
