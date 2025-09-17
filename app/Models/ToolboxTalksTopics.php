<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ToolboxTalksTopics extends Model
{
    use HasFactory;

    protected $table = 'toolbox_talks_topics';

    protected $fillable = [
        'toolbox_talks_id', // Change to match Laravel's convention
        'toolbox_topic_id',
    ];
}