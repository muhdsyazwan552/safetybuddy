<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ToolboxTalks extends Model
{
    use HasFactory;

    protected $table = 'toolbox_talks';

    protected $fillable = [
        'project_id',
        'conducted',
        'inspection_name',
        'total_attended',
        'img_group',
        'img_attendance',
        'inspection_date'
    
    ];

    // In ToolboxTalks model
    public function topics()
{
    return $this->belongsToMany(
        ToolboxTopic::class,
        'toolbox_talks_topics',
        'toolbox_talks_id', // Foreign key on the pivot table for this model
        'toolbox_topic_id' // Foreign key on the pivot table for the related model
    );
}

    public function project()
    {
        return $this->belongsTo(Project::class);
    }


}