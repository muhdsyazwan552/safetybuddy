<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Signed Worker Acknowledgement Register + briefing photos, sent by a subcontractor for approval. */
class SubconBriefingSubmission extends Model
{
    public const PENDING = 'pending';
    public const APPROVED = 'approved';
    public const RETURNED = 'returned';

    protected $table = 'subcon_briefing_submissions';

    /** A signed-in company only ever sees its own contractors' rows. */
    protected static function booted(): void
    {
        static::addGlobalScope(new \App\Models\Scopes\TenantScope('subcon_company'));
        static::saving(fn ($model) => \App\Models\Scopes\TenantScope::guardWrite($model));
    }

    protected $fillable = [
        'subcon_company_id', 'status', 'briefing_date', 'register_file', 'register_name', 'photos', 'notes',
        'submitted_at', 'reviewed_by', 'reviewed_at', 'review_comment',
    ];

    protected $casts = [
        'briefing_date' => 'date',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(SubconCompany::class, 'subcon_company_id');
    }

    public function workers()
    {
        return $this->belongsToMany(SubconStaff::class, 'subcon_briefing_workers', 'submission_id', 'subcon_staff_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(CompanyStaff::class, 'reviewed_by');
    }

    public function photoPaths(): array
    {
        $list = json_decode((string) $this->photos, true);

        return is_array($list) ? $list : [];
    }
}
