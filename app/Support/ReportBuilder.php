<?php

namespace App\Support;

use App\Models\Inspection;
use App\Models\InspectionReport;
use App\Models\MonthlyReport;
use App\Models\PerformanceSetting;
use App\Models\ToolboxTalks;
use Illuminate\Support\Facades\DB;

/**
 * Builds / refreshes the daily and monthly inspection reports from the recorded inspections.
 * A report that is approved is frozen: it keeps the numbers and the settings it was approved with.
 */
class ReportBuilder
{
    private const ORDER = ['rejected', 'pending_verification', 'verified', 'approved'];

    /** Least advanced stage decides the status of a report. */
    private static function overall(array $statuses): string
    {
        $statuses = array_values(array_filter($statuses));
        if (!$statuses) {
            return 'pending_verification';
        }
        foreach (self::ORDER as $stage) {
            if (in_array($stage, $statuses, true)) {
                return $stage;
            }
        }

        return 'approved';
    }

    /**
     * Safety Passport sample of a subcontractor from the talks of that project and day.
     * Returns [sampled, not_registered] or [null, null] when nothing was assessed.
     */
    private static function spFor(int $subconId, $talks): array
    {
        if ($talks->isEmpty()) {
            return [null, null];
        }

        $sampled = 0;
        $notReg = 0;
        $any = false;

        $rows = DB::table('toolbox_talk_sp')->whereIn('toolbox_talk_id', $talks->pluck('id'))->get()->groupBy('toolbox_talk_id');

        foreach ($talks as $talk) {
            $own = $rows->get($talk->id);
            if ($own && $own->isNotEmpty()) {
                $row = $own->firstWhere('subcon_company_id', $subconId);
                if ($row) {
                    $sampled += (int) $row->sampled;
                    $notReg += (int) $row->not_registered;
                    $any = true;
                }
                continue;
            }

            // older talk: only a project level number exists - share it by the attendees of each company
            if ($talk->sp_sampled !== null && (int) $talk->sp_sampled > 0) {
                $mine = DB::table('toolbox_talk_attendees as a')
                    ->join('subcon_staff as s', 's.id', '=', 'a.subcon_staff_id')
                    ->where('a.toolbox_talk_id', $talk->id)->where('s.company_id', $subconId)->count();
                if ($mine > 0) {
                    $sampled += $mine;
                    $notReg += (int) round((int) $talk->sp_not_registered * $mine / (int) $talk->sp_sampled);
                    $any = true;
                }
            }
        }

        return $any && $sampled > 0 ? [$sampled, $notReg] : [null, null];
    }

    /** A stored snapshot is only trusted when it is complete. */
    private static function usable($snapshot): bool
    {
        return is_array($snapshot) && count($snapshot) >= count(PerformanceSetting::KEYS) && !in_array(null, $snapshot, true);
    }

    /** Create / refresh the daily reports of a company. */
    public static function refreshDaily($companyId, $subconId = null): void
    {
        $inspections = Inspection::where('company_id', $companyId)->whereNotNull('subcon_company_id')
            ->when($subconId, fn ($q) => $q->where('subcon_company_id', $subconId))
            ->get();
        if ($inspections->isEmpty()) {
            return;
        }

        $current = PerformanceSetting::forCompany($companyId)->snapshot();
        $talksByDay = ToolboxTalks::whereIn('project_id', $inspections->pluck('project_id')->unique())->get()
            ->groupBy(fn ($t) => $t->project_id . '|' . optional($t->inspection_date)->format('Y-m-d'));

        $groups = $inspections->groupBy(fn ($i) => $i->project_id . '|' . $i->subcon_company_id . '|' . optional($i->inspection_date)->format('Y-m-d'));

        foreach ($groups as $key => $items) {
            [$projectId, $subconId, $date] = explode('|', $key);
            if (!$date) {
                continue;
            }

            $report = InspectionReport::where(['project_id' => $projectId, 'subcon_company_id' => $subconId, 'report_date' => $date])->first();
            if ($report && $report->status === 'approved') {
                continue; // frozen
            }

            $settings = ($report && self::usable($report->settings_snapshot)) ? $report->settings_snapshot : $current;
            $talks = $talksByDay->get($projectId . '|' . $date, collect());
            [$sampled, $notReg] = self::spFor((int) $subconId, $talks);

            $counts = [
                'good' => $items->where('evaluation', 'good')->count(),
                'poor' => $items->where('evaluation', 'poor')->count(),
                'nc' => $items->where('evaluation', 'nonconformance')->count(),
                'cc' => $items->where('evaluation', 'clientcomplaint')->count(),
            ];
            $r = Spgpnc::score($sampled, $notReg, $counts, $settings);

            $status = self::overall(array_merge(
                $items->pluck('status')->map(fn ($s) => $s ?: 'pending_verification')->all(),
                $talks->pluck('status')->map(fn ($s) => $s ?: 'pending_verification')->all(),
            ));

            $data = [
                'company_id' => $companyId,
                'report_no' => sprintf('DIR-%s-P%d-S%d', str_replace('-', '', $date), $projectId, $subconId),
                'status' => $status,
                'sp_sampled' => $r['sampled'], 'sp_not_registered' => $r['not_registered'],
                'good' => $r['good'], 'poor' => $r['poor'], 'nc' => $r['nc'], 'cc' => $r['cc'], 'total' => $r['total'],
                'sp_score' => $r['sp'], 'g_score' => $r['g'], 'p_score' => $r['p'], 'n_score' => $r['n'], 'c_score' => $r['c'],
                'spgpnc' => $r['spgpnc'], 'rank' => $r['rank'],
                'penalty_sp' => $r['penalty']['sp'], 'penalty_g' => $r['penalty']['g'], 'penalty_p' => $r['penalty']['p'],
                'penalty_nc' => $r['penalty']['nc'], 'penalty_cc' => $r['penalty']['cc'], 'penalty_total' => $r['penalty']['total'],
                'settings_snapshot' => $settings,
            ];

            if ($report) {
                $report->update($data);
            } else {
                InspectionReport::create($data + ['project_id' => $projectId, 'subcon_company_id' => $subconId, 'report_date' => $date]);
            }
        }
    }

    /** Create / refresh the monthly reports of a company from the approved daily reports. */
    public static function refreshMonthly($companyId): void
    {
        self::refreshDaily($companyId);

        $daily = InspectionReport::where('company_id', $companyId)->get();
        $groups = $daily->groupBy(fn ($d) => $d->project_id . '|' . $d->subcon_company_id . '|' . $d->report_date->format('Y-m'));
        $current = PerformanceSetting::forCompany($companyId)->snapshot();

        foreach ($groups as $key => $rows) {
            [$projectId, $subconId, $period] = explode('|', $key);

            $report = MonthlyReport::where(['project_id' => $projectId, 'subcon_company_id' => $subconId, 'period' => $period])->first();
            if ($report && $report->status === 'approved') {
                continue;
            }

            $settings = ($report && self::usable($report->settings_snapshot)) ? $report->settings_snapshot : $current;
            $approved = $rows->where('status', 'approved');

            $sums = [
                'sp_observations' => (int) $approved->sum('sp_sampled'),
                'sp_compliant' => (int) $approved->sum(fn ($d) => max(0, (int) $d->sp_sampled - (int) $d->sp_not_registered)),
                'good' => (int) $approved->sum('good'), 'poor' => (int) $approved->sum('poor'),
                'nc' => (int) $approved->sum('nc'), 'cc' => (int) $approved->sum('cc'),
            ];
            $r = Spgpnc::pooled($sums, $settings);

            // coverage: every approved inspection needs a valid SP sample for the overall score / rank
            $spAssessed = $approved->filter(fn ($d) => $d->sp_sampled !== null && (int) $d->sp_sampled > 0)->count();
            $coverageOk = $approved->count() > 0 && $spAssessed === $approved->count();
            $score = $coverageOk ? $r : array_merge($r, ['spgpnc' => null, 'rank' => null, 'complete' => false]);

            $data = [
                'company_id' => $companyId,
                'report_no' => sprintf('MIR-%s-P%d-S%d', str_replace('-', '', $period), $projectId, $subconId),
                'inspections_total' => $rows->count(),
                'inspections_approved' => $approved->count(),
                'sp_assessed' => $spAssessed,
                'sp_observations' => $sums['sp_observations'], 'sp_compliant' => $sums['sp_compliant'],
                'good' => $sums['good'], 'poor' => $sums['poor'], 'nc' => $sums['nc'], 'cc' => $sums['cc'], 'total' => $r['total'],
                'sp_score' => $r['sp'], 'g_score' => $r['g'], 'p_score' => $r['p'], 'n_score' => $r['n'], 'c_score' => $r['c'],
                'spgpnc' => $score['spgpnc'], 'rank' => $score['rank'],
                // penalties are summed from the individual inspections, never re-applied to the monthly scores
                'sp_below' => $approved->where('penalty_sp', '>', 0)->count(),
                'g_below' => $approved->where('penalty_g', '>', 0)->count(),
                'p_below' => $approved->where('penalty_p', '>', 0)->count(),
                'penalty_sp' => (float) $approved->sum('penalty_sp'), 'penalty_g' => (float) $approved->sum('penalty_g'),
                'penalty_p' => (float) $approved->sum('penalty_p'), 'penalty_nc' => (float) $approved->sum('penalty_nc'),
                'penalty_cc' => (float) $approved->sum('penalty_cc'), 'penalty_total' => (float) $approved->sum('penalty_total'),
                'settings_snapshot' => $settings,
            ];

            if ($report) {
                $report->update($data);
            } else {
                MonthlyReport::create($data + [
                    'project_id' => $projectId, 'subcon_company_id' => $subconId, 'period' => $period, 'status' => 'pending_verification',
                ]);
            }
        }
    }
}
