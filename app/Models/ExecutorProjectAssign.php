<?php

namespace App\Models; // ✅ Keep it in the correct namespace

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\Pivot; 
use App\Models\Project;   
use App\Models\Executor;  

class ExecutorProjectAssign extends Pivot
{
    use HasFactory;

    protected $table = 'executor_project_assign';

    protected $fillable = [
        'project_id',
        'entity_type',
        'entity_id',
        'role_assignment',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function executorCompany()
{
    return $this->belongsTo(Executor::class, 'entity_id', 'id'); 
    
}



   
    public function entity()
    {
        return $this->morphTo();
    }
}
