<?php

namespace App\Models;

use App\Models\Concerns\HasSeriesCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    use HasFactory, HasSeriesCode;

    public static function seriesType(): string
    {
        return 'ins';
    }

    protected $table = 'inspections';

    // Add this static property for evaluation options
    public static $evaluationOptions = [
        'good', 
        'poor', 
        'nonconformance', 
        'clientcomplaint'
    ];

    public const STATUS_PENDING  = 'pending_verification';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'toolbox_talk_id',
        'status',
        'verified_by',
        'verified_at',
        'approved_by',
        'approved_at',
        'review_comment',
        'project_id',
        'company_id',
        'inspection_by',
        'topic_inspection_id',
        'evaluation',
        'description',
        'photo',
        'subcon_company_id',
        'inspectee_id',
        'inspection_date',
        'location',
    ];

    protected $casts = [
        'inspection_date' => 'datetime',
        'verified_at' => 'datetime',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function subconCompany()
    {
        return $this->belongsTo(SubconCompany::class, 'subcon_company_id');
    }

    public function topic()
    {
        return $this->belongsTo(ToolboxTopic::class, 'topic_inspection_id');
    }

    public function toolboxTalk()
    {
        return $this->belongsTo(ToolboxTalks::class, 'toolbox_talk_id');
    }

    public function verifier()
    {
        return $this->belongsTo(CompanyStaff::class, 'verified_by');
    }

    public function approver()
    {
        return $this->belongsTo(CompanyStaff::class, 'approved_by');
    }

    public function inspector()
    {
        return $this->belongsTo(CompanyStaff::class, 'inspection_by');
    }

    public function non_conformance()
    {
        return $this->hasOne(NoConformance::class, 'inspection_id');
    }

    public function client_complaint()
    {
        return $this->hasOne(ClientComplaint::class, 'inspection_id');
    }
}