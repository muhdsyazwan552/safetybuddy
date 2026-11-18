<?php

namespace App\Support;

use App\Models\SubconCompany;
use App\Models\SubconStaff;
use App\Models\ToolboxTalks;
use Illuminate\Support\Facades\DB;

/**
 * Subcontractor staff that can be ticked as attendees of a toolbox talk.
 * For a project these are the active staff of the active contractor companies assigned to it.
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
        $assigns = DB::table('project_assign')->whereIn('project_id', $projectIds)->where('entity_type', 'compsub')->get();

        $companyIdsByProject = $assigns->groupBy('project_id')
            ->map(fn ($rows) => $rows->pluck('entity_id')->map(fn ($v) => (int) $v)->all());

        // only contractor companies assigned to the project, and only while the company is active
        $activeCompanies = SubconCompany::whereIn('id', $companyIdsByProject->flatten()->unique()->values())
            ->where('status', 'active')->pluck('name', 'id');

        $staff = SubconStaff::query()
            ->whereIn('company_id', $activeCompanies->keys())
            ->orderBy('name')
            ->get(['id', 'name', 'role', 'company_id', 'status'])
            ->filter(fn ($s) => strtolower((string) ($s->status ?: 'active')) === 'active');

        $out = [];
        foreach ($projectIds as $pid) {
            $companies = $companyIdsByProject[$pid] ?? [];

            $out[$pid] = $staff
                ->filter(fn ($s) => in_array((int) $s->company_id, $companies, true))
                ->map(fn ($s) => [
                    'id' => (int) $s->id,
                    'name' => $s->name,
                    'role' => $s->role,
                    'company_id' => (int) $s->company_id,
                    'company_name' => $activeCompanies[$s->company_id] ?? 'Company',
                ])
                ->values()
                ->all();
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
