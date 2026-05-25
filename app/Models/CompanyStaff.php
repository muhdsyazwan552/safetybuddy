<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyStaff extends Model
{
    use HasFactory;

    protected $table = 'company_staff';

    protected $fillable = [
        'company_id',
        'user_id',
        'name',
        'role_id',
        'email',
        'contact',
        'status'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'id');
    }

    /**
     * Get all project assignments for this staff
     */
    public function projectAssignments()
    {
        return $this->morphMany(ProjectAssign::class, 'entity_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }

    /**
     * Get all projects this staff is assigned to
     */
    public function projects()
    {
        return $this->belongsToMany(
            Project::class,
            'project_assign',
            'entity_id',
            'project_id'
        )->wherePivot('entity_type', 'staff');
    }

    public function toolboxTalks()
    {
        return $this->hasMany(ToolboxTalks::class, 'inspection_by');
    }
}