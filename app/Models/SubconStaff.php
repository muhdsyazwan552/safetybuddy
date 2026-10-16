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
        'user_id',
        'name',
        'role',
        'email',
        'contact',
        'status'
    ];

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