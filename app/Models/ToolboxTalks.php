<?php

namespace App\Models;

use App\Models\Concerns\HasSeriesCode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ToolboxTalks extends Model
{
    use HasFactory, HasSeriesCode;

    public static function seriesType(): string
    {
        return 'tbx';
    }

    protected $table = 'toolbox_talks';

    protected $fillable = [
        'project_id',
        'conducted',
        'inspection_by',
        'total_attended',
        'img_group',
        'img_attendance',
        'inspection_date',
        'sp_sampled',
        'sp_not_registered',
        'status',
        'verified_by',
        'verified_at',
        'approved_by',
        'approved_at',
        'review_comment',
    ];

    protected $appends = ['sp_compliance'];

    protected $casts = [
        'inspection_date' => 'datetime',
        'verified_at' => 'datetime',
        'approved_at' => 'datetime',
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

    /** Toolbox talk categories (separate from inspection topics). */
    public function categories()
    {
        return $this->belongsToMany(
            ToolboxCategory::class,
            'toolbox_talk_categories',
            'toolbox_talk_id',
            'toolbox_category_id'
        );
    }

    /** Safety Passport compliance % = (sampled - not registered) / sampled x 100 */
    public function getSpComplianceAttribute(): ?float
    {
        $sampled = (int) $this->sp_sampled;
        if ($sampled <= 0) {
            return null;
        }

        return round((($sampled - (int) $this->sp_not_registered) / $sampled) * 100, 2);
    }

    /** Subcontractor staff who attended this talk. */
    public function attendees()
    {
        return $this->belongsToMany(
            SubconStaff::class,
            'toolbox_talk_attendees',
            'toolbox_talk_id',
            'subcon_staff_id'
        )->withTimestamps();
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /** Inspections done in the same site visit. */
    public function inspections()
    {
        return $this->hasMany(Inspection::class, 'toolbox_talk_id');
    }

    public function verifier()
    {
        return $this->belongsTo(CompanyStaff::class, 'verified_by');
    }

    public function approver()
    {
        return $this->belongsTo(CompanyStaff::class, 'approved_by');
    }

    public function CompanyStaff()
    {
        return $this->belongsTo(CompanyStaff::class, 'inspection_by');
    }
    
}
