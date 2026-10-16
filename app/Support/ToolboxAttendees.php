<?php

namespace App\Support;

use App\Models\SubconCompany;
use App\Models\SubconStaff;
use App\Models\ToolboxTalks;
use Illuminate\Support\Facades\DB;

/**
 * Subcontractor staff that can be ticked as attendees of a toolbox talk.
 * For a project these are the staff of the subcontractor companies assigned to it,
 * plus any subcontractor staff assigned to the project individually.
 */
class ToolboxAttendees
{
    /**
     * @param  iterable<int>  $projectIds
     * @return array<int, array<int, array{id:int,name:string,role:?string,company_id:int,company_name:string}>>
     *         project_id => list of staff
     */
    public static function byProject(iterable $projectIds, ?int $ownerCompanyId = null): array
    {
        $projectIds = collect($projectIds)->map(fn ($id) => (int) $id)->unique()->values();
        if ($projectIds->isEmpty()) {
            return [];
        }

        // raw rows: the ProjectAssign model rewrites entity_type to class names
        $assigns = DB::table('project_assign')->whereIn('project_id', $projectIds)->get();

        $companyIdsByProject = $assigns->where('entity_type', 'compsub')
            ->groupBy('project_id')
            ->map(fn ($rows) => $rows->pluck('entity_id')->map(fn ($v) => (int) $v)->all());

        $staffIdsByProject = $assigns->where('entity_type', 'subcon')
            ->groupBy('project_id')
            ->map(fn ($rows) => $rows->pluck('entity_id')->map(fn ($v) => (int) $v)->all());

        $allCompanyIds = $companyIdsByProject->flatten()->unique()->values();
        $allStaffIds = $staffIdsByProject->flatten()->unique()->values();

        $staff = SubconStaff::query()
            ->where(function ($q) use ($allCompanyIds, $allStaffIds) {
                $q->whereIn('company_id', $allCompanyIds)->orWhereIn('id', $allStaffIds);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'role', 'company_id', 'status']);

        $companyNames = SubconCompany::whereIn('id', $staff->pluck('company_id')->unique())->pluck('name', 'id');

        $out = [];
        foreach ($projectIds as $pid) {
            $companies = $companyIdsByProject[$pid] ?? [];
            $individual = $staffIdsByProject[$pid] ?? [];

            $out[$pid] = $staff
                ->filter(fn ($s) => in_array((int) $s->company_id, $companies, true) || in_array((int) $s->id, $individual, true))
                ->filter(fn ($s) => strtolower((string) ($s->status ?: 'active')) === 'active')
                ->map(fn ($s) => [
                    'id' => (int) $s->id,
                    'name' => $s->name,
                    'role' => $s->role,
                    'company_id' => (int) $s->company_id,
                    'company_name' => $companyNames[$s->company_id] ?? 'Company',
                ])
                ->values()
                ->all();
        }

        // A project with no subcontractor assigned yet: fall back to every active subcontractor
        // staff member of the owning company, so a talk can still be recorded.
        if ($ownerCompanyId && collect($out)->contains(fn ($list) => count($list) === 0)) {
            $fallback = SubconStaff::query()
                ->whereIn('company_id', SubconCompany::where('company_id', $ownerCompanyId)->pluck('id'))
                ->orderBy('name')
                ->get(['id', 'name', 'role', 'company_id', 'status'])
                ->filter(fn ($s) => strtolower((string) ($s->status ?: 'active')) === 'active');

            $names = SubconCompany::whereIn('id', $fallback->pluck('company_id')->unique())->pluck('name', 'id');
            $list = $fallback->map(fn ($s) => [
                'id' => (int) $s->id,
                'name' => $s->name,
                'role' => $s->role,
                'company_id' => (int) $s->company_id,
                'company_name' => $names[$s->company_id] ?? 'Company',
            ])->values()->all();

            foreach ($out as $pid => $current) {
                if (count($current) === 0) {
                    $out[$pid] = $list;
                }
            }
        }

        return $out;
    }

    /** Keep only ids that really may attend a talk of this project. */
    public static function validIds(int $projectId, array $ids, ?int $ownerCompanyId = null): array
    {
        $allowed = collect(self::byProject([$projectId], $ownerCompanyId)[$projectId] ?? [])->pluck('id')->all();

        return array_values(array_unique(array_map('intval', array_intersect(array_map('intval', $ids), $allowed))));
    }

    /** Replace the attendee list of a talk and keep total_attended in step. */
    public static function sync(ToolboxTalks $talk, array $ids): int
    {
        $talk->attendees()->sync($ids);
        $talk->update(['total_attended' => count($ids)]);

        return count($ids);
    }
}
