<?php

namespace App\Support;

use App\Models\ToolboxTalks;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Safety Passport sampling of a toolbox talk, per subcontractor company.
 *   sampled        = staff of that company ticked as present (automatic)
 *   not registered = typed by the inspector for each company
 */
class ToolboxSp
{
    /**
     * Work out and validate the sampling before the talk is saved.
     *
     * @param  array       $attendeeIds   subcon_staff ids ticked as present
     * @param  array|null  $perCompany    [company_id => not registered]
     * @param  int|null    $legacyTotal   a single project level number (older forms)
     * @return array{rows: array<int, array{company_id:int, sampled:int, not_registered:int}>, sampled:?int, not_registered:?int}
     */
    public static function plan(array $attendeeIds, ?array $perCompany = null, ?int $legacyTotal = null): array
    {
        $attendeeIds = array_values(array_unique(array_map('intval', $attendeeIds)));
        if (!$attendeeIds) {
            throw ValidationException::withMessages([
                'attendees' => 'Select at least one person for Safety Passport sampling.',
                'attendee_ids' => 'Select at least one person for Safety Passport sampling.',
            ]);
        }

        $byCompany = DB::table('subcon_staff')->whereIn('id', $attendeeIds)->get(['id', 'company_id'])
            ->groupBy('company_id')->map->count();

        $perCompany = $perCompany ?? [];
        $remaining = $legacyTotal ?? 0;
        $useLegacy = empty($perCompany) && $remaining > 0;

        $rows = [];
        $errors = [];
        foreach ($byCompany as $companyId => $sampled) {
            if ($useLegacy) {
                $not = min($sampled, $remaining);
                $remaining -= $not;
            } else {
                $not = max(0, (int) ($perCompany[$companyId] ?? 0));
            }

            if ($not > $sampled) {
                $errors['sp'] = "Workers not registered cannot be more than the {$sampled} worker(s) sampled for one company.";
            }

            $rows[] = ['company_id' => (int) $companyId, 'sampled' => (int) $sampled, 'not_registered' => (int) $not];
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return [
            'rows' => $rows,
            'sampled' => array_sum(array_column($rows, 'sampled')),
            'not_registered' => array_sum(array_column($rows, 'not_registered')),
        ];
    }

    /** Store the planned rows and the totals on the talk. */
    public static function persist(ToolboxTalks $talk, array $plan): void
    {
        DB::table('toolbox_talk_sp')->where('toolbox_talk_id', $talk->id)->delete();

        $now = now();
        foreach ($plan['rows'] as $row) {
            DB::table('toolbox_talk_sp')->insert([
                'toolbox_talk_id' => $talk->id,
                'subcon_company_id' => $row['company_id'],
                'sampled' => $row['sampled'],
                'not_registered' => $row['not_registered'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $talk->update(['sp_sampled' => $plan['sampled'], 'sp_not_registered' => $plan['not_registered']]);
    }

    /** The per-company sampling of a talk, for the edit forms. */
    public static function forTalk(int $talkId): array
    {
        return DB::table('toolbox_talk_sp')->where('toolbox_talk_id', $talkId)
            ->pluck('not_registered', 'subcon_company_id')->all();
    }
}
