<?php

namespace App\Support;

use App\Models\ClientComplaint;
use App\Models\NoConformance;
use Illuminate\Support\Collection;

/**
 * Non-conformance / client complaint cases as one list, shared by the
 * subcontractor leader page and the Supervisor / Manager review portal.
 */
class CaseFeed
{
    public const WITH = [
        'inspection.project:id,name,company_id',
        'inspection.topic:id,name,code',
        'inspection.subconCompany:id,name',
        'inspection.inspector:id,name',
    ];

    public static function model(string $type)
    {
        return match ($type) {
            'nc' => new NoConformance(),
            'cc' => new ClientComplaint(),
            default => abort(404),
        };
    }

    /** Both case types for the given constraint, newest first. */
    public static function collect(callable $constrain): Collection
    {
        $rows = collect();
        foreach (['nc' => NoConformance::class, 'cc' => ClientComplaint::class] as $type => $class) {
            $query = $class::with(self::WITH);
            $constrain($query);
            foreach ($query->get() as $case) {
                $rows->push(self::row($type, $case));
            }
        }

        return $rows->sortByDesc('created_at')->values();
    }

    public static function detail(string $type, $case): array
    {
        $case->load([...self::WITH, 'inspection.verifier:id,name', 'inspection.approver:id,name']);
        $row = self::row($type, $case);

        $reviewer = $case->review_by ? \App\Models\CompanyStaff::find($case->review_by) : null;
        $inspection = $case->inspection;
        $row['reviewer'] = $reviewer?->name;
        $row['reviewer_role'] = match ((int) $reviewer?->role_id) {
            3 => 'Manager',
            4 => 'Supervisor',
            default => 'Reviewer',
        };
        $row['verifier'] = $inspection?->verifier?->name;
        $row['verified_at'] = $inspection?->verified_at?->toDateTimeString();
        $row['approver'] = $inspection?->approver?->name;
        $row['approved_at'] = $inspection?->approved_at?->toDateTimeString();
        $row['visit_key'] = $inspection && $inspection->toolbox_talk_id ? 'talk-' . $inspection->toolbox_talk_id : null;
        $row['evaluation'] = $inspection?->evaluation;

        return $row;
    }

    public static function state($case): string
    {
        return match (true) {
            $case->status === 'closed' => 'closed',
            (bool) $case->return_reason => 'returned',
            (bool) $case->subcon_response => 'responded',
            default => 'open',
        };
    }

    public static function row(string $type, $case): array
    {
        $i = $case->inspection;
        $photos = json_decode((string) $i?->photo, true);
        if (!is_array($photos)) {
            $photos = array_filter([$i?->photo]);
        }

        return [
            'key' => $type . '-' . $case->id,
            'type' => $type,
            'id' => $case->id,
            'series_code' => $case->code,
            'state' => self::state($case),
            'status' => $case->status,
            'date_open' => optional($case->date_open)->format('Y-m-d'),
            'date_close' => optional($case->date_close)->format('Y-m-d'),
            'comment' => $case->comment,
            'subcon_response' => $case->subcon_response,
            'response_photo' => UploadedAssets::url($case->response_photo),
            'responded_at' => optional($case->responded_at)->toDateTimeString(),
            'responded_by' => $case->responded_by,
            'return_reason' => $case->return_reason,
            'created_at' => optional($case->created_at)->toDateTimeString(),
            'inspection' => [
                'id' => $i?->id,
                'series_code' => $i?->code,
                'project_id' => $i?->project_id,
                'project' => $i?->project?->name,
                'subcon' => $i?->subconCompany?->name,
                'topic' => $i?->topic?->name,
                'location' => $i?->location,
                'description' => $i?->description,
                'inspection_date' => optional($i?->inspection_date)->format('Y-m-d'),
                'inspector' => $i?->inspector?->name,
                'approval' => $i?->status ?: \App\Models\Inspection::STATUS_PENDING, // review stage of the inspection itself
                'photos' => array_map(UploadedAssets::url(...), array_values($photos)),
            ],
        ];
    }
}
