<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\Pivot;
use App\Models\Project;
use App\Models\Company;

class ProjectAssign extends Pivot
{
    use HasFactory;

    protected $table = 'project_assign';

    protected $fillable = [
        'project_id',
        'entity_type',
        'entity_id',
        'role_assignment',
        'comment_scope'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the entity (staff or subcon staff) that owns this assignment
     * with custom mapping for entity_type strings
     */
    public function entity(): MorphTo
    {
        return $this->morphTo('entity', 'entity_type', 'entity_id');
    }

    /**
     * Override the morphTo relationship to handle custom mapping
     */
    public function getEntityTypeAttribute($value)
    {
        // Map the stored string to the actual model class
        $map = [
            'staff' => CompanyStaff::class,
            'subcon' => SubconStaff::class,
            'compsub' => SubconCompany::class, // Add this line
        ];

        return $map[$value] ?? $value;
    }

    /**
     * Helper method to get the actual entity instance
     */
    public function getEntity()
    {
        $modelClass = match ($this->entity_type) {
            'staff' => CompanyStaff::class,
            'subcon' => SubconStaff::class,
            'compsub' => SubconCompany::class, // Add this line
            default => null,
        };

        if ($modelClass && $this->entity_id) {
            return $modelClass::find($this->entity_id);
        }

        return null;
    }

    /**
     * Scopes
     */
    public function scopeStaff($query)
    {
        return $query->where('entity_type', 'staff');
    }

    public function scopeSubcon($query)
    {
        return $query->where('entity_type', 'subcon');
    }
}
