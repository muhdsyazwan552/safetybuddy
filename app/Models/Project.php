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
        'status'
    ];

    public function executors()
{
    return $this->belongsToMany(
        Executor::class,
        'executor_project_assign',
        'project_id',            // project foreign key
        'executor_company_id'    // company foreign key in pivot table
    )
    ->withPivot('role_assignment')
    ->withTimestamps();
}


    // Relationship with users (if needed)
    public function users()
    {
        return $this->hasMany(User::class);
    }

    // Use the morph-based pivot table for all assignments
    public function executorAssignments()
    {
        return $this->hasMany(ExecutorProjectAssign::class, 'project_id');
    }

public function executorCompanies()
{
    return $this->executorAssignments()
                ->where('entity_type', 'CP')
                ->with('executorCompany'); // this fetches the actual company
}






    // Only employees assigned to the project
    public function executorEmployees()
    {
        return $this->executorAssignments()->where('entity_type', 'EM');
    }
}