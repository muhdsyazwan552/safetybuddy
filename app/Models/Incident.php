<?php

namespace App\Models;

use App\Models\Concerns\HasSeriesCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    use HasFactory, HasSeriesCode;

    public static function seriesType(): string
    {
        return 'inc';
    }

    protected $table = 'incident';

    protected $fillable = [
        'company_id',
        'incident_date',
        'incident_id',
        'injury_id',
        'body_part',
        'project_id',
        'location',
        'subcon_company_id',
        'reported_by',
        'responsible_by',
        'lti_worker_count',
        'lti_days_lost',
        'lti_man_hours_lost',
        'incident_description',
        'immediate_cause',
        'underlying_cause',
        'attachment_upload',
        'immediate_action',
        'corrective',
        'status',
        'review_by',
        'manhours_lost',
    ];

    protected $casts = [
        'incident_date' => 'datetime',
        'lti_worker_count' => 'integer',
        'lti_days_lost' => 'integer',
        'lti_man_hours_lost' => 'integer',
        'manhours_lost' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function subcontractor()
    {
        return $this->belongsTo(SubconCompany::class, 'subcon_company_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function incidentType()
    {
        return $this->belongsTo(IncidentType::class, 'incident_id');
    }

    public function injuryType()
    {
        return $this->belongsTo(InjuryType::class, 'injury_id');
    }

    public function reportedBy()
    {
        return $this->belongsTo(CompanyStaff::class, 'reported_by');
    }

    public function responsibleBy()
    {
        return $this->belongsTo(CompanyStaff::class, 'responsible_by');
    }

    /** Responses of the Supervisor / Manager, oldest first. */
    public function responses()
    {
        return $this->hasMany(IncidentResponse::class, 'incident_id')->orderBy('id');
    }

    /** Subcontractor staff involved in the incident. */
    public function involvedStaff()
    {
        return $this->belongsToMany(SubconStaff::class, 'incident_staff', 'incident_id', 'subcon_staff_id')->withTimestamps();
    }

    public function reviewedBy()
    {
        return $this->belongsTo(CompanyStaff::class, 'review_by');
    }
}