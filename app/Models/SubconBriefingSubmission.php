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
