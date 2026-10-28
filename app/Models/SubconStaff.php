<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubconStaff extends Model
{
    use HasFactory;

    protected $table = 'subcon_staff';

    protected $fillable = [
        'company_id',
        'code',
        'serial_no',
        'user_id',
        'name',
        'role',
        'email',
        'contact',
        'status',
        'is_safetypassport',
        'supervisor_approved_by',
        'supervisor_approved_at',
        'manager_approved_by',
        'manager_approved_at',
        'sp_briefing_status',
        'sp_briefing_date'
    ];

    protected $casts = [
        'is_safetypassport' => 'boolean',
        'supervisor_approved_at' => 'datetime',
        'manager_approved_at' => 'datetime',
    ];

    /** Active once both the Supervisor and the Manager have approved the registration. */
    public function activateIfFullyApproved(): void
    {
        if ($this->status === 'pending' && $this->supervisor_approved_at && $this->manager_approved_at) {
            $this->forceFill(['status' => 'active'])->save();
        }
    }

    public function certifications()
    {
        return $this->hasMany(SubconStaffCertification::class, 'subcon_staff_id')->orderByDesc('id');
    }

    public function subconCompany()
    {
        return $this->belongsTo(SubconCompany::class, 'company_id', 'id');
    }

    /**
     * Get all project assignments for this subcon staff
     */
    public function projectAssignments()
    {
        return $this->morphMany(ProjectAssign::class, 'entity');
    }

    /**
     * Get all projects this subcon staff is assigned to
     */
    public function projects()
    {
        return $this->belongsToMany(
            Project::class,
            'project_assign',
            'entity_id',
            'project_id'
        )->wherePivot('entity_type', 'subcon');
    }
}
