<?php

namespace App\Support;

use App\Models\Inspection;
use App\Models\InspectionCategory;
use App\Models\ToolboxTalks;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/** The data of a toolbox talk / inspection detail page, shared by the review portal and the inspector. */
class DetailRows
{
    /** Needs: project, CompanyStaff, categories, attendees, verifier, approver loaded. */
    public static function toolbox(ToolboxTalks $t): array
    {
        $sp = DB::table('toolbox_talk_sp')
            ->leftJoin('subcon_company', 'subcon_company.id', '=', 'toolbox_talk_sp.subcon_company_id')
            ->where('toolbox_talk_sp.toolbox_talk_id', $t->id)
            ->get(['subcon_company.name as company', 'toolbox_talk_sp.sampled', 'toolbox_talk_sp.not_registered'])
            ->map(fn ($r) => ['company' => $r->company ?: '-', 'sampled' => (int) $r->sampled, 'not_registered' => (int) $r->not_registered])
            ->values();

        $url = fn ($p) => $p ? Storage::url($p) : null;

        return [
            'id' => $t->id,
            'series_code' => $t->code,
            'project' => optional($t->project)->name,
            'by' => optional($t->CompanyStaff)->name,
            'date' => optional($t->inspection_date)->format('Y-m-d'),
            'conducted' => $t->conducted === 'yes',
            'attended' => (int) $t->total_attended,
            'attendees' => $t->attendees->map(fn ($a) => ['id' => $a->id, 'name' => $a->name, 'role' => $a->role])->values(),
            'categories' => $t->categories->pluck('name')->values(),
            'sp_sampled' => $t->sp_sampled,
            'sp_not_registered' => $t->sp_not_registered,
            'sp_compliance' => $t->sp_compliance,
            'sp_companies' => $sp,
            'status' => $t->status ?: Inspection::STATUS_PENDING,
            'review_comment' => $t->review_comment,
            'verifier' => optional($t->verifier)->name,
            'verified_at' => optional($t->verified_at)->format('Y-m-d H:i'),
            'approver' => optional($t->approver)->name,
            'approved_at' => optional($t->approved_at)->format('Y-m-d H:i'),
            'img_group' => $url($t->img_group),
            'img_attendance' => $url($t->img_attendance),
            'inspections' => $t->inspections()->count(),
        ];
    }

    /** Needs: project, topic, subconCompany, inspector, verifier, approver, non_conformance, client_complaint loaded. */
    public static function inspection(Inspection $i): array
    {
        $photos = json_decode((string) $i->photo, true);
        if (!is_array($photos)) {
            $photos = array_filter([$i->photo]);
        }

        $category = $i->topic?->inspection_category_id
            ? InspectionCategory::where('id', $i->topic->inspection_category_id)->value('name')
            : null;

        return [
            'id' => $i->id,
            'series_code' => $i->code,
            'project' => optional($i->project)->name,
            'category' => $category,
            'topic' => optional($i->topic)->name,
            'code' => optional($i->topic)->code,
            'subcon' => optional($i->subconCompany)->name,
            'inspector' => optional($i->inspector)->name,
            'evaluation' => $i->evaluation,
            'status' => $i->status ?: Inspection::STATUS_PENDING,
            'date' => optional($i->inspection_date)->format('Y-m-d'),
            'location' => $i->location,
            'description' => $i->description,
            'photos' => collect($photos)->map(fn ($p) => Storage::url($p))->values(),
            'verifier' => optional($i->verifier)->name,
            'verified_at' => optional($i->verified_at)->format('Y-m-d H:i'),
            'approver' => optional($i->approver)->name,
            'approved_at' => optional($i->approved_at)->format('Y-m-d H:i'),
            'review_comment' => $i->review_comment,
            'visit_key' => $i->toolbox_talk_id ? 'talk-' . $i->toolbox_talk_id : null,
            'nc' => $i->non_conformance ? ['id' => $i->non_conformance->id, 'series_code' => $i->non_conformance->code, 'status' => $i->non_conformance->status] : null,
            'cc' => $i->client_complaint ? ['id' => $i->client_complaint->id, 'series_code' => $i->client_complaint->code, 'status' => $i->client_complaint->status] : null,
        ];
    }
}