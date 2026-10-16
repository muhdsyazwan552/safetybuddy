<?php

namespace App\Support;

use App\Models\Manhour;
use App\Models\Project;
use App\Models\SubconCompany;
use App\Models\SubconMachinery;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Everything about one subcontractor company - staff, daily attendance, NC / CC,
 * safety induction and machinery - shared by the admin, review and inspector pages.
 */
class SubconDetail
{
    /** Subcontractor of the given owner company, or 404. */
    public static function find($id, ?int $ownerCompanyId): SubconCompany
    {
        return SubconCompany::when($ownerCompanyId, fn ($q) => $q->where('company_id', $ownerCompanyId))
            ->findOrFail($id);
    }

    public static function for(SubconCompany $company): array
    {
        // safety induction: every topic of the owner company and when the leader acknowledged it
        $progress = SubconCompliance::sync($company);
        $company->refresh()->load('subconStaff.certifications');

        $ackedAt = DB::table('subcon_induction_acks')->where('subcon_company_id', $company->id)
            ->pluck('acknowledged_at', 'topic_id');
        $topics = SubconCompliance::topicsFor($company)->map(fn ($t) => [
            'id' => $t->id,
            'title' => $t->title,
            'acked' => in_array((int) $t->id, $progress['acked'], true),
            'acknowledged_at' => $ackedAt[$t->id] ?? null,
            'items' => $t->items->map(fn ($i) => ['type' => $i->type, 'content' => $i->content])->values(),
        ])->values();

        $staff = $company->subconStaff->map(function ($s) {
            $row = $s->toArray();
            $row['certifications'] = $s->certifications->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'expiry_date' => optional($c->expiry_date)->format('Y-m-d'),
                'file_url' => Storage::url($c->file),
                'original_name' => $c->original_name,
            ])->values();

            return $row;
        })->values();
        $staffNames = $company->subconStaff->pluck('name', 'id');

        $machinery = SubconMachinery::where('subcon_company_id', $company->id)
            ->orderByDesc('id')->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'identifier' => $m->identifier,
                'cf_url' => $m->cf_file ? Storage::url($m->cf_file) : null,
                'cf_expiry' => optional($m->cf_expiry)->format('Y-m-d'),
                'operator_name' => $staffNames[$m->operator_id] ?? null,
            ])->values();

        // NC / CC raised against this company
        $cases = CaseFeed::collect(fn ($q) => $q->whereHas('inspection', fn ($i) => $i->where('subcon_company_id', $company->id)));

        // daily attendance across every project: headcount per day plus who was ticked present
        $present = DB::table('manhour_attendances as a')
            ->join('subcon_staff as s', 's.id', '=', 'a.subcon_staff_id')
            ->where('a.subcon_company_id', $company->id)
            ->orderBy('s.name')
            ->get(['a.project_id', 'a.work_date', 's.id', 's.name', 's.role'])
            ->groupBy(fn ($r) => $r->project_id . '|' . substr((string) $r->work_date, 0, 10));
        $days = Manhour::where('subcon_company_id', $company->id)
            ->orderByDesc('work_date')->limit(200)->get(['project_id', 'work_date', 'worker_count', 'working_hours']);
        $projectNames = Project::whereIn('id', $days->pluck('project_id'))->pluck('name', 'id');
        $attendance = $days->map(function ($m) use ($present, $projectNames) {
            $date = substr((string) $m->work_date, 0, 10);

            return [
                'key' => $m->project_id . '|' . $date,
                'date' => $date,
                'project' => $projectNames[$m->project_id] ?? '-',
                'workers' => (int) $m->worker_count,
                'hours' => (float) $m->working_hours,
                'manhours' => round($m->worker_count * (float) $m->working_hours, 2),
                'staff' => $present->get($m->project_id . '|' . $date, collect())
                    ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'role' => $r->role])->values(),
            ];
        })->values();

        return [
            'staff' => $staff,
            'machinery' => $machinery,
            'cases' => $cases,
            'attendance' => $attendance,
            'induction' => [
                'topics' => $topics,
                'total' => $progress['total'],
                'done' => $progress['done'],
                'complete' => $progress['complete'],
            ],
        ];
    }
}
