<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ToolboxTopic extends Model
{
    use HasFactory;

    protected $table = 'toolbox_topic';

   
    protected $fillable = [
        'name',
        'description',
    ];



public function toolboxTalks()
{
    return $this->belongsToMany(
        ToolboxTalks::class,
        'toolbox_talks_topics',
        'toolbox_topic_id', // Foreign key on the pivot table for this model
        'toolbox_talks_id'   // Foreign key on the pivot table for the related model
    );
}

}