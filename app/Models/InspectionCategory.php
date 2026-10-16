<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionCategory extends Model
{
    protected $fillable = ['code', 'name', 'sort_order'];

    public function items()
    {
        return $this->hasMany(ToolboxTopic::class, 'inspection_category_id')->orderBy('code');
    }

    /** Categories with their inspection items, for the category -> sub topic selector. */
    public static function catalogue()
    {
        return static::with('items:id,inspection_category_id,code,name')
            ->orderBy('sort_order')
            ->get(['id', 'code', 'name']);
    }
}
