<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Monthly inspection report: pooled approved daily reports of a project / subcontractor. */
class MonthlyReport extends Model
{
    protected $table = 'monthly_reports';

    protected $guarded = ['id'];

    protected $casts = [
        'settings_snapshot' => 'array',
        'verified_at' => 'datetime',
        'approved_at' => 'datetime',
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
