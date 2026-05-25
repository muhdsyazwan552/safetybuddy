<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $table = 'projects';

    protected $fillable = [
        'company_id',
        'name',
        'location',
        'start_date',
        'end_date',
        'status',
        'progress'
    ];

    /**
     * Get all assignments for this project (polymorphic)
     * FIXED: Method name should be lowercase for property access
     */
    public function projectAssign()
    {
        return $this->hasMany(ProjectAssign::class, 'project_id');
    }

    /**
     * Get staff assignments (main company staff)
     */
    public function staffAssignments()
    {
        return $this->projectAssign()->where('entity_type', 'staff');
    }

    /**
     * Get subcon assignments
     */
    public function subconAssignments()
    {
        return $this->projectAssign()->where('entity_type', 'subcon');
    }

    /**
     * Get compsub assignments
     */

    public function compsubAssignments()
    {
        return $this->projectAssign()->where('entity_type', 'compsub');
    }

    /**
     * Get all assigned staff members (main company)
     */
    public function assignedStaff()
    {
        return $this->belongsToMany(
            CompanyStaff::class,
            'project_assign',
            'project_id',
            'entity_id'
        )->wherePivot('entity_type', 'staff');
    }

    /**
     * Get all assigned subcon staff
     */
    public function assignedSubconStaff()
    {
        return $this->belongsToMany(
            SubconStaff::class,
            'project_assign',
            'project_id',
            'entity_id'
        )->wherePivot('entity_type', 'subcon');
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class, 'project_id');
    }

    public function toolboxTalks()
    {
        return $this->hasMany(ToolboxTalks::class, 'project_id');
    }
}
