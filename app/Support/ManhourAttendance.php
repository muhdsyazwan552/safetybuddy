<?php

namespace App\Support;

use App\Models\Manhour;
use App\Models\Project;
use App\Models\SubconStaff;
use Illuminate\Support\Facades\DB;

/**
 * Daily attendance of subcontractor staff. Every ticked worker counts as the
 * standard working day; the daily manhour record is derived from the ticks.
 */
class ManhourAttendance
{
    public const HOURS_PER_WORKER = 8;

    /** Is the subcontractor assigned to the project? */
    public static function isAssigned(int $projectId, int $subconId): bool
    {
        return DB::table('project_assign')
            ->where('project_id', $projectId)
            ->where('entity_type', 'compsub')
            ->where('entity_id', $subconId)
            ->exists();
    }

    /** Staff ids ticked for that project / subcontractor / day. */
    public static function ticked(int $projectId, int $subconId, string $date): array
    {
        return DB::table('manhour_attendances')
            ->where('project_id', $projectId)
            ->where('subcon_company_id', $subconId)
            ->where('work_date', $date)
            ->pluck('subcon_staff_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /** Replace the day's attendance with the given staff and refresh the daily manhour total. */
    public static function save(Project $project, int $subconId, string $date, array $staffIds): int
    {
        $staffIds = SubconStaff::where('company_id', $subconId)
            ->whereIn('id', array_unique(array_map('intval', $staffIds)))
            ->pluck('id')
            ->all();

        DB::transaction(function () use ($project, $subconId, $date, $staffIds) {
            $scope = DB::table('manhour_attendances')
                ->where('project_id', $project->id)
                ->where('subcon_company_id', $subconId)
                ->where('work_date', $date);
            $scope->delete();

            $now = now();
            foreach ($staffIds as $staffId) {
                DB::table('manhour_attendances')->insert([
                    'project_id' => $project->id,
                    'subcon_company_id' => $subconId,
                    'subcon_staff_id' => $staffId,
                    'work_date' => $date,
                    'hours' => self::HOURS_PER_WORKER,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $key = ['project_id' => $project->id, 'subcon_company_id' => $subconId, 'work_date' => $date];
            if (count($staffIds) === 0) {
                Manhour::where($key)->delete();
            } else {
                Manhour::updateOrCreate($key, [
                    'company_id' => $project->company_id,
                    'worker_count' => count($staffIds),
                    'working_hours' => self::HOURS_PER_WORKER,
                ]);
            }
        });

        return count($staffIds);
    }
}
