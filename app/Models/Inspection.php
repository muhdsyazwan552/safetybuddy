<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    use HasFactory;

    protected $table = 'inspections';

    protected $fillable = [
        'project_id',
        'executor_companies_id',
        'topic_inspection_id',
        'inspection_name',
        'inspection_date',
        'location',
        'evaluation',
        'description',
        'photo',
        'created_by',
    ];

    protected $casts = [
        'inspection_date' => 'date',
        'photo' => 'array',
    ];

    // Validation rules
    public static $evaluationOptions = [
        'good',
        'moderate', 
        'poor',
        'nonconformance',
        'clientcomplaint'
    ];

    // Relationships
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function executorCompany()
    {
        return $this->belongsTo(Executor::class, 'executor_companies_id');
    }

    public function topic()
    {
        return $this->belongsTo(ToolboxTopic::class, 'topic_inspection_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}