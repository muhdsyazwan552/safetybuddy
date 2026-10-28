<?php

namespace App\Http\Controllers;

use App\Models\CompanyStaff;
use App\Models\InspectionReport;
use App\Models\MonthlyReport;
use App\Models\NoConformance;
use App\Models\PerformanceSetting;
use App\Models\Project;
use App\Support\ReportBuilder;
use App\Support\Spgpnc;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * SPGPNC & BSPR performance: settings, daily inspection reports, monthly inspection reports.
 * Shared by the company admin (read only) and the Supervisor / Manager review portal.
 */
class PerformanceController extends Controller
{
    private const PER_PAGE = 12;

    // ------------------------------------------------------------------ helpers

    private function companyId()
    {
        return Auth::user()->company_id;
    }

    private function portal(Request $request): string
    {
        return $request->routeIs('review.*') ? 'review' : 'admin';
    }

    private function base(string $portal): array
    {
        return $portal === 'review'
            ? ['daily' => '/review/reports', 'monthly' => '/review/reports', 'list' => '/review/reports', 'learn' => '/review/performance']
            : ['daily' => '/daily-reports', 'monthly' => '/monthly-reports', 'list' => null, 'learn' => '/performance/learn-more'];
    }

    private function roleFlags(): array
    {
        $role = (int) Auth::user()->role_id;

        return [
            'can_verify' => in_array($role, [3, 4], true),
            'can_approve' => $role === 3,
        ];
    }

    private function norm(string $v): string
    {
        return mb_strtolower(trim($v));
    }

    private function filters(Request $request): array
    {
        $date = fn ($v) => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $v) ? $v : null;

        return [
            'q' => trim((string) $request->query('q', '')),
            'project_id' => $request->query('project_id') ?: null,
            'from' => $date($request->query('from')),
            'to' => $date($request->query('to')),
            'status' => $request->query('status', 'all'),
            'rank' => $request->query('rank', 'all'),
            'sort' => $request->query('sort') === 'oldest' ? 'oldest' : 'newest',
            'page' => max(1, (int) $request->query('page', 1)),
        ];
    }

    private function paginate(Collection $rows, int $page): array
    {
        $total = $rows->count();
        $pages = max(1, (int) ceil($total / self::PER_PAGE));
        $page = min($page, $pages);

        return [
            $rows->slice(($page - 1) * self::PER_PAGE, self::PER_PAGE)->values(),
            [
                'total' => $total, 'page' => $page, 'pages' => $pages, 'per_page' => self::PER_PAGE,
                'from' => $total ? ($page - 1) * self::PER_PAGE + 1 : 0, 'to' => min($total, $page * self::PER_PAGE),
            ],
        ];
    }

    public function names(Collection $rows): array
    {
        $projects = Project::whereIn('id', $rows->pluck('project_id')->unique())->pluck('name', 'id');
        $subcons = DB::table('subcon_company')->whereIn('id', $rows->pluck('subcon_company_id')->unique())->pluck('name', 'id');

        return [$projects, $subcons];
    }

    private function settingsRow(): array
    {
        return PerformanceSetting::forCompany($this->companyId())->snapshot() + ['id' => null];
    }

    private function usableSnapshot($snapshot)
    {
        return is_array($snapshot) && count($snapshot) >= count(PerformanceSetting::KEYS) && !in_array(null, $snapshot, true) ? $snapshot : null;
    }

    // ------------------------------------------------------------------ row builders

    public function dailyRow(InspectionReport $r, $projects, $subcons, bool $full = false): array
    {
        $settings = $this->usableSnapshot($r->settings_snapshot) ?: PerformanceSetting::forCompany($r->company_id)->snapshot();
        $calc = Spgpnc::score($r->sp_sampled === null ? null : (int) $r->sp_sampled, $r->sp_not_registered === null ? null : (int) $r->sp_not_registered,
            ['good' => $r->good, 'poor' => $r->poor, 'nc' => $r->nc, 'cc' => $r->cc], $settings);

        $row = [
            'id' => $r->id,
            'report_no' => $r->report_no,
            'date' => $r->report_date->format('Y-m-d'),
            'project_id' => $r->project_id,
            'project' => $projects[$r->project_id] ?? '-',
            'subcon' => $subcons[$r->subcon_company_id] ?? '-',
            'status' => $r->status,
            'sampled' => $r->sp_sampled, 'not_registered' => $r->sp_not_registered, 'compliant' => $calc['compliant'],
            'good' => $r->good, 'poor' => $r->poor, 'nc' => $r->nc, 'cc' => $r->cc, 'total' => $r->total,
            'sp' => $r->sp_score, 'g' => $r->g_score, 'p' => $r->p_score, 'n' => $r->n_score, 'c' => $r->c_score,
            'spgpnc' => $r->spgpnc, 'rank' => $r->rank, 'complete' => $calc['complete'],
            'result' => $calc['result'],
            'penalty' => [
                'sp' => (float) $r->penalty_sp, 'g' => (float) $r->penalty_g, 'p' => (float) $r->penalty_p,
                'nc' => (float) $r->penalty_nc, 'cc' => (float) $r->penalty_cc, 'total' => (float) $r->penalty_total,
            ],
            'penalty_status' => $r->penalty_status,
            'settings' => $settings,
        ];

        if ($full) {
            $ids = DB::table('inspections')->where('project_id', $r->project_id)->where('subcon_company_id', $r->subcon_company_id)
                ->whereDate('inspection_date', $r->report_date)->pluck('id');
            $openNc = NoConformance::whereIn('inspection_id', $ids)->where('status', 'open')->count();
            $row['open_nc'] = $openNc;
            $row['follow_up'] = $this->followUp($row, $openNc, $settings);
            $row['reviewed_by'] = $r->penalty_reviewed_by ? CompanyStaff::where('id', $r->penalty_reviewed_by)->value('name') : null;
        }

        return $row;
    }

    private function followUp(array $r, int $openNc, array $s): array
    {
        $out = [];
        if ($r['sampled'] === null) {
            $out[] = 'Record the Safety Passport sampling for this day.';
        } elseif ($r['not_registered'] > 0) {
            $out[] = 'Resolve ' . $r['not_registered'] . ' unregistered worker(s).';
        }
        if ($r['result']['g'] === 'below') $out[] = 'Improve GOOD findings (below ' . rtrim(rtrim(number_format($s['g_benchmark'], 2), '0'), '.') . '%).';
        if ($r['poor'] > 0) $out[] = 'Address ' . $r['poor'] . ' POOR finding(s).';
        if ($openNc > 0) $out[] = 'Respond to ' . $openNc . ' open NC.';

        return $out;
    }

    public function monthlyRow(MonthlyReport $m, $projects, $subcons, bool $full = false): array
    {
        $settings = $this->usableSnapshot($m->settings_snapshot) ?: PerformanceSetting::forCompany($m->company_id)->snapshot();

        $row = [
            'id' => $m->id,
            'report_no' => $m->report_no,
            'period' => $m->period,
            'project_id' => $m->project_id,
            'project' => $projects[$m->project_id] ?? '-',
            'subcon' => $subcons[$m->subcon_company_id] ?? '-',
            'status' => $m->status,
            'inspections_total' => $m->inspections_total, 'inspections_approved' => $m->inspections_approved,
            'sp_assessed' => $m->sp_assessed, 'sp_observations' => $m->sp_observations, 'sp_compliant' => $m->sp_compliant,
            'good' => $m->good, 'poor' => $m->poor, 'nc' => $m->nc, 'cc' => $m->cc, 'total' => $m->total,
            'sp' => $m->sp_score, 'g' => $m->g_score, 'p' => $m->p_score, 'n' => $m->n_score, 'c' => $m->c_score,
            'spgpnc' => $m->spgpnc, 'rank' => $m->rank,
            'coverage_ok' => $m->inspections_approved > 0 && $m->sp_assessed === $m->inspections_approved,
            'penalty' => [
                'sp' => (float) $m->penalty_sp, 'g' => (float) $m->penalty_g, 'p' => (float) $m->penalty_p,
                'nc' => (float) $m->penalty_nc, 'cc' => (float) $m->penalty_cc, 'total' => (float) $m->penalty_total,
                'sp_below' => $m->sp_below, 'g_below' => $m->g_below, 'p_below' => $m->p_below,
            ],
            'settings' => $settings,
            'review_comment' => $m->review_comment,
        ];

        if ($full) {
            $row['verified_by'] = $m->verified_by ? CompanyStaff::where('id', $m->verified_by)->value('name') : null;
            $row['approved_by'] = $m->approved_by ? CompanyStaff::where('id', $m->approved_by)->value('name') : null;
            $row['verified_at'] = optional($m->verified_at)->format('Y-m-d H:i');
            $row['approved_at'] = optional($m->approved_at)->format('Y-m-d H:i');
            $row['days'] = InspectionReport::where('project_id', $m->project_id)->where('subcon_company_id', $m->subcon_company_id)
                ->where('report_date', 'like', $m->period . '%')->orderBy('report_date')
                ->get(['id', 'report_date', 'status', 'spgpnc', 'rank', 'penalty_total'])
                ->map(fn ($d) => [
                    'id' => $d->id, 'date' => $d->report_date->format('Y-m-d'), 'status' => $d->status,
                    'spgpnc' => $d->spgpnc, 'rank' => $d->rank, 'penalty' => (float) $d->penalty_total,
                ]);
        }

        return $row;
    }

    // ------------------------------------------------------------------ lists

    public function index(Request $request)
    {
        $portal = $this->portal($request);
        $tab = $request->query('tab');
        if (!in_array($tab, ['daily', 'monthly'], true)) {
            $tab = $request->routeIs('monthly.reports') ? 'monthly' : 'daily';
        }

        $companyId = $this->companyId();
        $tab === 'monthly' ? ReportBuilder::refreshMonthly($companyId) : ReportBuilder::refreshDaily($companyId);

        $f = $this->filters($request);

        if ($tab === 'daily') {
            $all = InspectionReport::where('company_id', $companyId)->get();
        } else {
            $all = MonthlyReport::where('company_id', $companyId)->get();
        }
        [$projects, $subcons] = $this->names($all);

        $rows = $all->map(fn ($r) => $tab === 'daily' ? $this->dailyRow($r, $projects, $subcons) : $this->monthlyRow($r, $projects, $subcons));
        $dateOf = fn ($r) => $tab === 'daily' ? $r['date'] : $r['period'];

        $base = $rows->filter(function ($r) use ($f, $tab, $dateOf) {
            if ($f['project_id'] && (int) $r['project_id'] !== (int) $f['project_id']) return false;
            $d = $dateOf($r);
            if ($f['from'] && substr($d, 0, $tab === 'daily' ? 10 : 7) < substr($f['from'], 0, $tab === 'daily' ? 10 : 7)) return false;
            if ($f['to'] && substr($d, 0, $tab === 'daily' ? 10 : 7) > substr($f['to'], 0, $tab === 'daily' ? 10 : 7)) return false;
            if ($f['rank'] !== 'all' && ($r['rank'] ?? 'NONE') !== $f['rank']) return false;
            if ($f['q'] !== '') {
                $hay = $this->norm(implode(' ', [$r['project'], $r['subcon'], $r['report_no'], $d]));
                if (!str_contains($hay, $this->norm($f['q']))) return false;
            }

            return true;
        });

        $counts = ['all' => $base->count()] + $base->countBy('status')->all();
        $filtered = $f['status'] === 'all' ? $base : $base->where('status', $f['status']);
        $filtered = $f['sort'] === 'oldest' ? $filtered->sortBy($dateOf) : $filtered->sortByDesc($dateOf);
        [$page, $meta] = $this->paginate($filtered->values(), $f['page']);

        return Inertia::render('Reports/Index', [
            'portal' => $portal,
            'tab' => $tab,
            'rows' => $page,
            'meta' => $meta,
            'counts' => $counts,
            'filters' => $f,
            'projects' => Project::where('company_id', $companyId)->orderBy('name')->get(['id', 'name']),
            'links' => $this->base($portal),
            'settings' => $this->settingsRow(),
        ]);
    }

    public function dailyShow(Request $request, int $id)
    {
        $portal = $this->portal($request);
        $r = InspectionReport::where('company_id', $this->companyId())->findOrFail($id);
        [$projects, $subcons] = $this->names(collect([$r]));

        return Inertia::render('Reports/DailyShow', [
            'portal' => $portal,
            'report' => $this->dailyRow($r, $projects, $subcons, true),
            'links' => $this->base($portal),
        ] + $this->roleFlags());
    }

    public function monthlyShow(Request $request, int $id)
    {
        $portal = $this->portal($request);
        $m = MonthlyReport::where('company_id', $this->companyId())->findOrFail($id);
        [$projects, $subcons] = $this->names(collect([$m]));

        return Inertia::render('Reports/MonthlyShow', [
            'portal' => $portal,
            'report' => $this->monthlyRow($m, $projects, $subcons, true),
            'links' => $this->base($portal),
        ] + $this->roleFlags());
    }

    public function learnMore(Request $request)
    {
        $portal = $this->portal($request);

        return Inertia::render('Reports/LearnMore', [
            'portal' => $portal,
            'settings' => $this->settingsRow(),
            'links' => $this->base($portal),
        ]);
    }

    // ------------------------------------------------------------------ settings (company admin)

    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'sp_benchmark' => 'required|numeric|min:0|max:100',
            'g_benchmark' => 'required|numeric|min:0|max:100',
            'p_benchmark' => 'required|numeric|min:0|max:100',
            'sp_penalty' => 'required|numeric|min:0|max:1000000',
            'g_penalty' => 'required|numeric|min:0|max:1000000',
            'p_penalty' => 'required|numeric|min:0|max:1000000',
            'nc_penalty' => 'required|numeric|min:0|max:1000000',
            'cc_penalty' => 'required|numeric|min:0|max:1000000',
            'gold_min' => 'required|numeric|min:0|max:100',
            'silver_min' => 'required|numeric|min:0|max:100|lte:gold_min',
            'scoring_on' => 'required|boolean',
            'bspr_on' => 'required|boolean',
            'penalties_on' => 'required|boolean',
        ], ['silver_min.lte' => 'Silver minimum cannot be higher than the Gold minimum.']);

        PerformanceSetting::forCompany($this->companyId())->update($data);

        return back()->with('success', 'Performance settings saved. Existing reports keep the settings they were created with.');
    }

    // ------------------------------------------------------------------ review actions (Supervisor / Manager)

    private function staffId()
    {
        return CompanyStaff::where('user_id', Auth::id())->value('id');
    }

    /** Manager confirms or waives the calculated penalty of an approved daily report. */
    public function penaltyReview(Request $request, int $id)
    {
        abort_unless((int) Auth::user()->role_id === 3, 403, 'Only a Manager can review penalties.');
        $data = $request->validate(['decision' => 'required|in:confirmed,waived']);

        $r = InspectionReport::where('company_id', $this->companyId())->findOrFail($id);
        abort_unless($r->status === 'approved', 422, 'The inspection report must be approved first.');

        $r->update([
            'penalty_status' => $data['decision'],
            'penalty_reviewed_by' => $this->staffId(),
            'penalty_reviewed_at' => now(),
        ]);

        return back()->with('success', 'Penalty ' . $data['decision'] . '.');
    }

    private function monthly(int $id): MonthlyReport
    {
        return MonthlyReport::where('company_id', $this->companyId())->findOrFail($id);
    }

    public function monthlyVerify(int $id)
    {
        $m = $this->monthly($id);
        abort_unless(in_array($m->status, ['pending_verification', 'rejected'], true), 422, 'This report is not waiting for verification.');
        abort_unless($m->inspections_approved > 0, 422, 'There are no approved inspections in this month yet.');

        $m->update(['status' => 'verified', 'verified_by' => $this->staffId(), 'verified_at' => now(), 'review_comment' => null]);

        return back()->with('success', 'Monthly report verified.');
    }

    public function monthlyApprove(int $id)
    {
        abort_unless((int) Auth::user()->role_id === 3, 403, 'Only a Manager can approve.');
        $m = $this->monthly($id);
        abort_unless($m->status === 'verified', 422, 'The report must be verified first.');

        $m->update(['status' => 'approved', 'approved_by' => $this->staffId(), 'approved_at' => now()]);

        return back()->with('success', 'Monthly report approved.');
    }

    public function monthlyReject(Request $request, int $id)
    {
        $data = $request->validate(['comment' => 'required|string|max:1000']);
        $m = $this->monthly($id);
        abort_unless(in_array($m->status, ['pending_verification', 'verified'], true), 422);

        $m->update(['status' => 'rejected', 'review_comment' => $data['comment'], 'verified_by' => null, 'verified_at' => null]);

        return back()->with('success', 'Monthly report returned.');
    }
}
