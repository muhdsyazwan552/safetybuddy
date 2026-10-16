<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SafetyInductionItem extends Model
{
    public const TYPES = ['paragraph', 'subheading', 'bullet', 'highlight'];

    protected $fillable = ['topic_id', 'sort_order', 'type', 'content'];
}
