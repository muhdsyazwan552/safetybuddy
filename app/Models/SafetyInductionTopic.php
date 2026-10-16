<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SafetyInductionTopic extends Model
{
    protected $fillable = [
        'company_id', 'default_key', 'title', 'sort_order', 'is_active', 'is_customised',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_customised' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(SafetyInductionItem::class, 'topic_id')->orderBy('sort_order')->orderBy('id');
    }
}
