<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ToolboxCategory extends Model
{
    protected $fillable = ['name', 'sort_order', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    /** Active categories in display order, as [id, name]. */
    public static function options()
    {
        return static::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'name']);
    }
}
