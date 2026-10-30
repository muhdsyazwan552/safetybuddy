<?php

namespace App\Support;

use App\Models\Inspection;
use App\Models\ToolboxTalks;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * A "site visit" = one toolbox talk together with the inspections done in the same visit.
 * Inspections that were not part of a talk appear as visits of their own.
 *
 * With $merge = true older records are folded together as well: an inspection that was
 * saved without a link to a talk joins the talk of the same project, day and inspector, and
 * the remaining ones are grouped per project / day / inspector.
 */
class VisitFeed
{
    /** Overall stage of a visit: the least advanced record decides. */
    private static function overall(array $statuses): string
    {
        $statuses = array_values(array_filter($statuses));
        if (!$statuses) {
            return Inspection::STATUS_PENDING;
        }
        foreach ([Inspection::STATUS_REJECTED, Inspection::STATUS_PENDING, Inspection::STATUS_VERIFIED] as $stage) {
            if (in_array($stage, $statuses, true)) {
                return $stage;
            }
        }

        return Inspection::STATUS_APPROVED;
    }

    private static function url(?string $path): ?string
    {
        return $path ? Storage::url($path) : null;
    }

    private static function inspectionRow(Inspection $i): array
    {
        $photos = json_decode((string) $i->photo, true);
        if (!is_array($photos)) {
            $photos = array_filter([$i->photo]);
        }

        return [
            'id' => $i->id,
            'series_code' => $i->code,
            'by_id' => $i->inspection_by,
            'topic' => optional($i->topic)->name,
            'evaluation' => $i->evaluation,
            'status' => $i->status ?: Inspection::STATUS_PENDING,
            'location' => $i->location,
            'subcon' => optional($i->subconCompany)->name,
            'description' => $i->description,
            'date' => optional($i->inspection_date)->format('Y-m-d'),
            'verifier' => optional($i->verifier)->name,
            'approver' => optional($i->approver)->name,
            'review_comment' => $i->review_comment,
            'photos' => collect($photos)->map(fn ($p) => self::url($p))->values(),
        ];
    }

    private static function mergeKey($projectId, $date, $staffId): string
    {
        return $projectId . '|' . $date . '|' . $staffId;
    }

    /**
     * @param  int|null  $companyId  company the projects belong to
     * @param  iterable|null  $projectIds  restrict to these projects
     * @param  int|null  $staffId  only visits created by this staff
     * @param  bool  $merge  also fold older, unlinked inspections into visits
     */
    public static function collect($companyId, $projectIds = null, $staffId = null, bool $merge = false): Collection
    {
        $projectIds = $projectIds === null ? null : collect($projectIds);

        $talks = ToolboxTalks::with([
                'project:id,name,company_id',
                'CompanyStaff:id,name',
                'categories:id,name',
                'attendees:id,name',
                'inspections.topic:id,name',
                'inspections.subconCompany:id,name',
                'inspections.verifier:id,name',
                'inspections.approver:id,name',
            ])
            ->whereHas('project', fn ($q) => $q->where('company_id', $companyId))
            ->when($projectIds, fn ($q) => $q->whereIn('project_id', $projectIds))
            ->when($staffId, fn ($q) => $q->where('inspection_by', $staffId))
            ->get();

        $visits = collect();
        $byKey = [];

        foreach ($talks as $t) {
            $inspections = $t->inspections->map(fn ($i) => self::inspectionRow($i))->values()->all();
            $date = optional($t->inspection_date)->format('Y-m-d');

            $visit = [
                'key' => 'talk-' . $t->id,
                'talk_id' => $t->id,
                'date' => $date,
                'sort' => $date . sprintf('%010d', $t->id),
                'project' => optional($t->project)->name,
                'project_id' => $t->project_id,
                'by' => optional($t->CompanyStaff)->name,
                'by_id' => $t->inspection_by,
                'talk' => [
                    'id' => $t->id,
                    'series_code' => $t->code,
                    'by_id' => $t->inspection_by,
                    'conducted' => $t->conducted === 'yes',
                    'attended' => (int) $t->total_attended,
                    'attendees' => $t->attendees->pluck('name')->values(),
                    'categories' => $t->categories->pluck('name')->values(),
                    'sp_sampled' => $t->sp_sampled,
                    'sp_not_registered' => $t->sp_not_registered,
                    'sp_compliance' => $t->sp_compliance,
                    'status' => $t->status ?: Inspection::STATUS_PENDING,
                    'review_comment' => $t->review_comment,
                    'img_group' => self::url($t->img_group),
                    'img_attendance' => self::url($t->img_attendance),
                ],
                'inspections' => $inspections,
            ];

            $visits->push($visit);
            $k = self::mergeKey($t->project_id, $date, $t->inspection_by);
            $byKey[$k] ??= $visits->count() - 1;
        }

        $loose = Inspection::with(['project:id,name,company_id', 'inspector:id,name', 'topic:id,name', 'subconCompany:id,name', 'verifier:id,name', 'approver:id,name'])
            ->whereNull('toolbox_talk_id')
            ->where('company_id', $companyId)
            ->when($projectIds, fn ($q) => $q->whereIn('project_id', $projectIds))
            ->when($staffId, fn ($q) => $q->where('inspection_by', $staffId))
            ->get();

        $groups = [];
        foreach ($loose as $i) {
            $row = self::inspectionRow($i);
            $k = self::mergeKey($i->project_id, $row['date'], $i->inspection_by);

            if ($merge && isset($byKey[$k])) {
                // join the talk of the same project / day / inspector
                $v = $visits[$byKey[$k]];
                $v['inspections'][] = $row;
                $visits[$byKey[$k]] = $v;
                continue;
            }

            if ($merge) {
                $groups[$k] ??= [
                    'key' => 'grp-' . $i->project_id . '-' . $row['date'] . '-' . $i->inspection_by,
                    'talk_id' => null,
                    'date' => $row['date'],
                    'sort' => ($row['date'] ?? '') . sprintf('%010d', $i->id),
                    'project' => optional($i->project)->name,
                    'project_id' => $i->project_id,
                    'by' => optional($i->inspector)->name,
                    'by_id' => $i->inspection_by,
                    'talk' => null,
                    'inspections' => [],
                ];
                $groups[$k]['inspections'][] = $row;
                continue;
            }

            $visits->push([
                'key' => 'insp-' . $i->id,
                'talk_id' => null,
                'date' => $row['date'],
                'sort' => ($row['date'] ?? '') . sprintf('%010d', $i->id),
                'project' => optional($i->project)->name,
                'project_id' => $i->project_id,
                'by' => optional($i->inspector)->name,
                'by_id' => $i->inspection_by,
                'talk' => null,
                'inspections' => [$row],
            ]);
        }

        foreach ($groups as $g) {
            $visits->push($g);
        }

        return $visits
            ->map(function (array $v) {
                $statuses = array_column($v['inspections'], 'status');
                if ($v['talk']) {
                    $statuses[] = $v['talk']['status'];
                }
                $v['status'] = self::overall($statuses);
                $v['inspections'] = collect($v['inspections'])->values();

                return $v;
            })
            ->sortByDesc('sort')
            ->values();
    }
}
