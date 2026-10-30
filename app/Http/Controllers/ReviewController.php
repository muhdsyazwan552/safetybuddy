<?php

namespace App\Http\Controllers;

use App\Models\CompanyStaff;
use App\Models\Inspection;
use App\Support\CaseFeed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Review portal for Supervisors (role 4) and Managers (role 3):
 * verify / approve inspections and answer the NC / CC cases raised by the subcontractor leader.
 */
class ReviewController extends Controller
{
    private function companyId()
    {
        return Auth::user()->company_id;
    }

    private function inspections()
    {
        return Inspection::with(['project:id,name', 'topic:id,name,code', 'subconCompany:id,name', 'inspector:id,name', 'verifier:id,name', 'approver:id,name'])
            ->where('company_id', $this->companyId());
    }

    private function cases()
    {
        $companyId = $this->companyId();

        return CaseFeed::collect(fn ($q) => $q->whereHas('inspection', fn ($i) => $i->where('company_id', $companyId)));
    }

    private function roleFlags(): array
    {
        $role = (int) Auth::user()->role_id;

        return [
            'is_manager' => $role === 3,
            'can_verify' => in_array($role, [3, 4], true),
            'can_approve' => $role === 3,
        ];
    }

    public function dashboard()
    {
        $companyId = $this->companyId();
        $flags = $this->roleFlags();

        \App\Support\ReportBuilder::refreshDaily($companyId);

        // site visits waiting for a decision
        $visits = \App\Support\VisitFeed::collect($companyId);
        $toVerify = $visits->where('status', 'pending_verification');
        $toApprove = $visits->where('status', 'verified');

        // NC / CC
        $cases = $this->cases();
        $caseReview = $cases->where('state', 'responded');
        $caseWaiting = $cases->whereIn('state', ['open', 'returned']);

        // incidents
        $incidents = $this->incidentQuery()->orderByDesc('incident_date')->get();
        $incOpen = $incidents->filter(fn ($i) => in_array(strtolower((string) ($i->status ?: 'open')), ['open', 'inprogress'], true));
        $incNew = $incidents->filter(fn ($i) => strtolower((string) ($i->status ?: 'open')) === 'open');

        // reports
        $monthly = \App\Models\MonthlyReport::where('company_id', $companyId)->get();
        $dailyAll = \App\Models\InspectionReport::where('company_id', $companyId)->get();
        $penaltyPending = $dailyAll->where('status', 'approved')->where('penalty_status', 'pending_review')->where('penalty_total', '>', 0);

        // this month's performance (approved daily reports)
        $month = now()->format('Y-m');
        $thisMonth = $dailyAll->filter(fn ($d) => $d->status === 'approved' && $d->report_date->format('Y-m') === $month);
        $scored = $thisMonth->whereNotNull('spgpnc');

        $names = \App\Models\Project::where('company_id', $companyId)->pluck('name', 'id');

        $visitRow = fn ($v) => [
            'key' => $v['key'], 'date' => $v['date'], 'project' => $v['project'], 'by' => $v['by'],
            'status' => $v['status'], 'inspections' => count($v['inspections']),
            'toolbox' => $v['talk'] ? ($v['talk']['conducted'] ? 'conducted' : 'not conducted') : null,
        ];

        return Inertia::render('Review/Dashboard', [
            'counts' => [
                'visits_verify' => $toVerify->count(),
                'visits_approve' => $toApprove->count(),
                'cases_review' => $caseReview->count(),
                'cases_waiting' => $caseWaiting->count(),
                'incidents_open' => $incOpen->count(),
                'incidents_new' => $incNew->count(),
                'monthly_verify' => $monthly->whereIn('status', ['pending_verification', 'rejected'])->where('inspections_approved', '>', 0)->count(),
                'monthly_approve' => $monthly->where('status', 'verified')->count(),
                'penalties_pending' => $penaltyPending->count(),
            ],
            'queue' => ($flags['is_manager'] ? $toApprove->concat($toVerify) : $toVerify)->sortBy('sort')->take(5)->map($visitRow)->values(),
            'cases' => $caseReview->concat($caseWaiting)->take(4)->values(),
            'incidents' => $incOpen->take(4)->map(fn ($i) => $this->incidentRow($i))->values(),
            'performance' => [
                'period' => $month,
                'reports' => $thisMonth->count(),
                'avg' => $scored->count() ? round($scored->avg('spgpnc'), 2) : null,
                'ranks' => [
                    'GOLD' => $scored->where('rank', 'GOLD')->count(),
                    'SILVER' => $scored->where('rank', 'SILVER')->count(),
                    'BRONZE' => $scored->where('rank', 'BRONZE')->count(),
                ],
                'penalty' => (float) $thisMonth->sum('penalty_total'),
                'pending_penalty' => (float) $penaltyPending->sum('penalty_total'),
            ],
            'today' => [
                'visits' => $visits->where('date', now()->toDateString())->count(),
                'incidents' => $incidents->filter(fn ($i) => optional($i->incident_date)->toDateString() === now()->toDateString())->count(),
            ],
            ...$flags,
        ]);
    }

    public function inspectionsIndex(Request $request)
    {
        return Inertia::render('Review/Inspections', [
            'inspections' => $this->inspections()->latest('id')->get(),
            'filter' => $request->query('status', 'all'),
            ...$this->roleFlags(),
        ]);
    }

    // ------------------------------------------------------------------ projects

    /** Open NC / CC per project of this company. */
    private function openCasesByProject($projectIds): array
    {
        $open = [];
        foreach ([\App\Models\NoConformance::class, \App\Models\ClientComplaint::class] as $class) {
            $table = (new $class)->getTable();
            $class::where("{$table}.status", '!=', 'closed')
                ->join('inspections as i', 'i.id', '=', "{$table}.inspection_id")->whereIn('i.project_id', $projectIds)
                ->selectRaw('i.project_id as pid, count(*) as n')->groupBy('i.project_id')
                ->pluck('n', 'pid')->each(function ($n, $pid) use (&$open) {
                    $open[$pid] = ($open[$pid] ?? 0) + $n;
                });
        }

        return $open;
    }

    public function projectsIndex(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', '');

        $all = \App\Models\Project::where('company_id', $this->companyId())
            ->withCount(['inspections', 'toolboxTalks'])
            ->orderByDesc('created_at')->get();

        $statusCounts = $all->countBy(fn ($p) => $p->status ?: 'unknown');
        $rows = $all
            ->when($q !== '', fn ($c) => $c->filter(fn ($p) => str_contains(mb_strtolower($p->name . ' ' . $p->location), mb_strtolower($q))))
            ->when($status !== '', fn ($c) => $c->where('status', $status));

        $ids = $rows->pluck('id');
        $openCases = $this->openCasesByProject($ids);
        $subcons = \Illuminate\Support\Facades\DB::table('project_assign')->where('entity_type', 'compsub')->whereIn('project_id', $ids)
            ->selectRaw('project_id, count(*) as n')->groupBy('project_id')->pluck('n', 'project_id');

        return Inertia::render('Review/Projects', [
            'filters' => ['q' => $q, 'status' => $status],
            'statusCounts' => $statusCounts,
            'projects' => $rows->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'location' => $p->location,
                'status' => $p->status,
                'start_date' => $p->start_date,
                'end_date' => $p->end_date,
                'inspections' => $p->inspections_count,
                'talks' => $p->toolbox_talks_count,
                'subcons' => (int) ($subcons[$p->id] ?? 0),
                'open_cases' => (int) ($openCases[$p->id] ?? 0),
            ])->values(),
        ]);
    }

    public function projectShow($id)
    {
        $project = \App\Models\Project::where('company_id', $this->companyId())->findOrFail($id);
        $assigns = \Illuminate\Support\Facades\DB::table('project_assign')->where('project_id', $id)->get();

        $staffAssign = $assigns->where('entity_type', 'staff');
        $team = CompanyStaff::whereIn('id', $staffAssign->pluck('entity_id'))->orderBy('name')->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'contact' => $m->contact,
                'role' => optional($staffAssign->firstWhere('entity_id', $m->id))->role_assignment,
            ])->values();

        $compAssign = $assigns->where('entity_type', 'compsub');
        $inspections = Inspection::where('project_id', $id)->get(['id', 'evaluation', 'subcon_company_id']);
        $perSubcon = $inspections->countBy('subcon_company_id');
        $workersToday = \App\Models\Manhour::where('project_id', $id)->where('work_date', now()->toDateString())
            ->pluck('worker_count', 'subcon_company_id');
        $subcons = \App\Models\SubconCompany::whereIn('id', $compAssign->pluck('entity_id'))->withCount('subconStaff')->orderBy('name')->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'contact' => $c->contact,
                'status' => $c->status,
                'scope' => optional($compAssign->firstWhere('entity_id', $c->id))->role_assignment,
                'staff' => $c->subcon_staff_count,
                'present_today' => (int) ($workersToday[$c->id] ?? 0),
                'inspections' => (int) ($perSubcon[$c->id] ?? 0),
            ])->values();

        $evaluation = [];
        foreach (['good', 'poor', 'nonconformance', 'clientcomplaint'] as $ev) {
            $evaluation[$ev] = $inspections->where('evaluation', $ev)->count();
        }

        $visits = \App\Support\VisitFeed::collect($this->companyId(), [$project->id]);
        $cases = CaseFeed::collect(fn ($q) => $q->whereHas('inspection', fn ($i) => $i->where('project_id', $project->id)));
        $manhours = \App\Models\Manhour::where('project_id', $id)
            ->selectRaw('count(distinct work_date) as days, coalesce(sum(worker_count * working_hours), 0) as total')->first();

        return Inertia::render('Review/ProjectShow', [
            'project' => $project->only(['id', 'name', 'location', 'status', 'start_date', 'end_date']),
            'stats' => [
                'inspections' => $inspections->count(),
                'visits' => $visits->count(),
                'open_cases' => $cases->where('state', '!=', 'closed')->count(),
                'manhours' => round((float) $manhours->total, 2),
                'work_days' => (int) $manhours->days,
            ],
            'evaluation' => $evaluation,
            'team' => $team,
            'subcons' => $subcons,
            'visits' => $visits->values(), // paged on the page itself
            'cases' => $cases->values(),
        ]);
    }

    // ------------------------------------------------------------------ subcontractors

    /** Subcontractor companies of this company with a quick health summary. */
    public function subconsIndex(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $companies = \App\Models\SubconCompany::where('company_id', $this->companyId())
            ->withCount('subconStaff')
            ->when($q !== '', fn ($w) => $w->where('name', 'like', "%{$q}%"))
            ->orderBy('name')->get(['id', 'name', 'email', 'contact', 'status']);

        $ids = $companies->pluck('id');
        $openCases = [];
        foreach ([\App\Models\NoConformance::class, \App\Models\ClientComplaint::class] as $class) {
            $table = (new $class)->getTable();
            $class::where("{$table}.status", '!=', 'closed')
                ->join('inspections as i', 'i.id', '=', "{$table}.inspection_id")->whereIn('i.subcon_company_id', $ids)
                ->selectRaw('i.subcon_company_id as sid, count(*) as n')->groupBy('i.subcon_company_id')
                ->pluck('n', 'sid')->each(function ($n, $sid) use (&$openCases) {
                    $openCases[$sid] = ($openCases[$sid] ?? 0) + $n;
                });
        }
        $machines = \App\Models\SubconMachinery::whereIn('subcon_company_id', $ids)
            ->selectRaw('subcon_company_id, count(*) as n')->groupBy('subcon_company_id')->pluck('n', 'subcon_company_id');
        $today = \App\Models\Manhour::whereIn('subcon_company_id', $ids)->where('work_date', now()->toDateString())
            ->selectRaw('subcon_company_id, sum(worker_count) as n')->groupBy('subcon_company_id')->pluck('n', 'subcon_company_id');

        return Inertia::render('Review/Subcons', [
            'filters' => ['q' => $q],
            'companies' => $companies->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'contact' => $c->contact,
                'status' => $c->status,
                'staff' => $c->subcon_staff_count,
                'machinery' => (int) ($machines[$c->id] ?? 0),
                'present_today' => (int) ($today[$c->id] ?? 0),
                'open_cases' => (int) ($openCases[$c->id] ?? 0),
            ])->values(),
        ]);
    }

    public function subconShow($id)
    {
        $company = \App\Support\SubconDetail::find($id, $this->companyId());
        $detail = \App\Support\SubconDetail::for($company);

        return Inertia::render('Review/SubconShow', [
            'company' => $company->only(['id', 'name', 'email', 'contact', 'address', 'status']),
        ] + $detail);
    }

    public function casesIndex(Request $request)
    {
        $f = $this->listFilters($request) + [
            'state' => $request->query('state', 'all'),
            'type' => $request->query('type', 'all'), // all | nc | cc
        ];

        $all = $this->cases();

        $base = $all->filter(function ($c) use ($f) {
            $i = $c['inspection'];
            if ($f['project_id'] && (int) ($i['project_id'] ?? 0) !== (int) $f['project_id']) return false;
            if ($f['type'] !== 'all' && $c['type'] !== $f['type']) return false;
            if ($f['from'] && ($c['date_open'] ?? '') < $f['from']) return false;
            if ($f['to'] && ($c['date_open'] ?? '') > $f['to']) return false;

            if ($f['q'] !== '') {
                $hay = $this->normalise(implode(' ', array_filter([
                    $i['project'] ?? null, $i['topic'] ?? null, $i['subcon'] ?? null, $i['location'] ?? null,
                    $i['inspector'] ?? null, $i['description'] ?? null, $c['subcon_response'], $c['date_open'], '#' . $c['id'], $c['series_code'] ?? null, $i['series_code'] ?? null,
                ])));
                if (!str_contains($hay, $this->normalise($f['q']))) return false;
            }

            return true;
        });

        $counts = ['all' => $base->count()] + $base->countBy('state')->all();

        $rows = $f['state'] === 'all' ? $base : $base->where('state', $f['state']);
        $rows = $f['sort'] === 'oldest' ? $rows->sortBy('created_at') : $rows->sortByDesc('created_at');
        [$page, $meta] = $this->pageOf($rows->values(), $f['page']);

        return Inertia::render('Review/Cases', [
            'cases' => $page,
            'meta' => $meta,
            'counts' => $counts,
            'filters' => $f,
            'projects' => $this->projectOptions(),
        ]);
    }

    /** Toolbox talk + inspections of the same site visit, with their verify / approve status. */
    // ------------------------------------------------------------------ searchable, paginated lists

    private const PER_PAGE = 12;

    private function normalise(string $value): string
    {
        return mb_strtolower(trim($value));
    }

    /** common request filters: text, project, date range, sort */
    private function listFilters(Request $request): array
    {
        $date = fn ($v) => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $v) ? $v : null;

        return [
            'q' => trim((string) $request->query('q', '')),
            'project_id' => $request->query('project_id') ?: null,
            'from' => $date($request->query('from')),
            'to' => $date($request->query('to')),
            'sort' => $request->query('sort') === 'oldest' ? 'oldest' : 'newest',
            'page' => max(1, (int) $request->query('page', 1)),
        ];
    }

    private function pageOf(\Illuminate\Support\Collection $rows, int $page): array
    {
        $total = $rows->count();
        $pages = max(1, (int) ceil($total / self::PER_PAGE));
        $page = min($page, $pages);

        return [
            $rows->slice(($page - 1) * self::PER_PAGE, self::PER_PAGE)->values(),
            [
                'total' => $total, 'page' => $page, 'pages' => $pages, 'per_page' => self::PER_PAGE,
                'from' => $total ? ($page - 1) * self::PER_PAGE + 1 : 0,
                'to' => min($total, $page * self::PER_PAGE),
            ],
        ];
    }

    private function projectOptions()
    {
        return \App\Models\Project::where('company_id', $this->companyId())->orderBy('name')->get(['id', 'name']);
    }

    public function visitsIndex(Request $request)
    {
        $f = $this->listFilters($request) + [
            'status' => $request->query('status', 'all'),
            'toolbox' => $request->query('toolbox', 'all'),       // all | yes | no | none
            'evaluation' => $request->query('evaluation', 'all'),  // any inspection with this result
        ];

        $all = \App\Support\VisitFeed::collect($this->companyId());

        $base = $all->filter(function ($v) use ($f) {
            if ($f['project_id'] && (int) $v['project_id'] !== (int) $f['project_id']) return false;
            if ($f['from'] && ($v['date'] ?? '') < $f['from']) return false;
            if ($f['to'] && ($v['date'] ?? '') > $f['to']) return false;

            if ($f['toolbox'] === 'yes' && !($v['talk'] && $v['talk']['conducted'])) return false;
            if ($f['toolbox'] === 'no' && !($v['talk'] && !$v['talk']['conducted'])) return false;
            if ($f['toolbox'] === 'none' && $v['talk']) return false;

            if ($f['evaluation'] !== 'all' && !collect($v['inspections'])->contains(fn ($i) => $i['evaluation'] === $f['evaluation'])) return false;

            if ($f['q'] !== '') {
                $hay = $this->normalise(implode(' ', array_filter([
                    $v['project'], $v['by'], $v['date'], $v['talk']['series_code'] ?? null,
                    ...collect($v['inspections'])->flatMap(fn ($i) => [$i['series_code'], $i['topic'], $i['subcon'], $i['location'], $i['description']])->all(),
                ])));
                if (!str_contains($hay, $this->normalise($f['q']))) return false;
            }

            return true;
        });

        $counts = ['all' => $base->count()] + $base->countBy('status')->all();

        $rows = $f['status'] === 'all' ? $base : $base->where('status', $f['status']);
        $rows = $f['sort'] === 'oldest' ? $rows->sortBy('sort') : $rows->sortByDesc('sort');
        [$page, $meta] = $this->pageOf($rows->values(), $f['page']);

        return Inertia::render('Review/Visits', [
            'visits' => $page,
            'meta' => $meta,
            'counts' => $counts,
            'filters' => $f,
            'projects' => $this->projectOptions(),
            ...$this->roleFlags(),
        ]);
    }

    private function visitTalk(int $id): \App\Models\ToolboxTalks
    {
        $talk = \App\Models\ToolboxTalks::with('project:id,company_id')->findOrFail($id);
        abort_unless((int) optional($talk->project)->company_id === (int) $this->companyId(), 404);

        return $talk;
    }

    /** Apply one step to the talk and to every inspection of the visit that is at the matching stage. */
    private function stepVisit(int $id, string $from, array $talkChanges, array $inspectionChanges): void
    {
        $talk = $this->visitTalk($id);
        $talk->status === $from && $talk->update($talkChanges);
        \App\Models\Inspection::where('toolbox_talk_id', $talk->id)->where('status', $from)->update($inspectionChanges);
    }

    public function visitVerify(int $id)
    {
        $staffId = CompanyStaff::where('user_id', Auth::id())->value('id');
        $c = ['status' => \App\Models\Inspection::STATUS_VERIFIED, 'verified_by' => $staffId, 'verified_at' => now(), 'review_comment' => null];
        $this->stepVisit($id, \App\Models\Inspection::STATUS_PENDING, $c, $c);

        return back()->with('success', 'Toolbox talk & Inspection verified.');
    }

    public function visitApprove(int $id)
    {
        abort_unless((int) Auth::user()->role_id === 3, 403, 'Only a Manager can approve.');
        $staffId = CompanyStaff::where('user_id', Auth::id())->value('id');
        $c = ['status' => \App\Models\Inspection::STATUS_APPROVED, 'approved_by' => $staffId, 'approved_at' => now()];
        $this->stepVisit($id, \App\Models\Inspection::STATUS_VERIFIED, $c, $c);

        return back()->with('success', 'Toolbox talk & Inspection approved.');
    }

    public function visitReject(Request $request, int $id)
    {
        $data = $request->validate(['comment' => 'required|string|max:1000']);
        $talk = $this->visitTalk($id);
        $c = ['status' => \App\Models\Inspection::STATUS_REJECTED, 'review_comment' => $data['comment'], 'verified_by' => null, 'verified_at' => null];

        if (in_array($talk->status, [\App\Models\Inspection::STATUS_PENDING, \App\Models\Inspection::STATUS_VERIFIED], true)) {
            $talk->update($c);
        }
        \App\Models\Inspection::where('toolbox_talk_id', $talk->id)
            ->whereIn('status', [\App\Models\Inspection::STATUS_PENDING, \App\Models\Inspection::STATUS_VERIFIED])
            ->update($c);

        return back()->with('success', 'Toolbox talk & Inspection returned to the inspector.');
    }

    /** Toolbox talks of the company - conducted or not, with Safety Passport sampling. */
    public function toolboxIndex()
    {
        $companyId = $this->companyId();

        $talks = \App\Models\ToolboxTalks::with(['project:id,name', 'CompanyStaff:id,name', 'categories:id,name'])
            ->whereHas('project', fn ($q) => $q->where('company_id', $companyId))
            ->orderByDesc('inspection_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'series_code' => $t->code,
                'date' => optional($t->inspection_date)->format('Y-m-d'),
                'project' => optional($t->project)->name,
                'by' => optional($t->CompanyStaff)->name,
                'conducted' => $t->conducted === 'yes',
                'attended' => (int) $t->total_attended,
                'categories' => $t->categories->pluck('name')->values(),
                'sp_sampled' => $t->sp_sampled,
                'sp_not_registered' => $t->sp_not_registered,
                'sp_compliance' => $t->sp_compliance,
                'inspections' => $t->inspections()->count(),
            ]);

        return Inertia::render('Review/Toolbox', ['talks' => $talks]);
    }

    // ------------------------------------------------------------------ reported accidents (incidents)

    private function incidentRow(\App\Models\Incident $i, bool $full = false): array
    {
        $row = [
            'id' => $i->id,
            'series_code' => $i->code,
            'date' => optional($i->incident_date)->format('Y-m-d H:i'),
            'day' => optional($i->incident_date)->format('Y-m-d'),
            'project_id' => $i->project_id,
            'project' => optional($i->project)->name,
            'subcon' => optional($i->subcontractor)->name,
            'type' => optional($i->incidentType)->name,
            'type_id' => $i->incident_id,
            'injury' => optional($i->injuryType)->name,
            'body_part' => $i->body_part,
            'location' => $i->location,
            'description' => $i->incident_description,
            'status' => strtolower((string) ($i->status ?: 'open')),
            'reported_by' => optional($i->reportedBy)->name,
            'responsible' => optional($i->responsibleBy)->name,
            'involved_count' => $i->involvedStaff->count(),
            'responses_count' => $i->responses->count(),
        ];

        if ($full) {
            $row += [
                'immediate_cause' => $i->immediate_cause,
                'underlying_cause' => $i->underlying_cause,
                'immediate_action' => $i->immediate_action,
                'corrective' => $i->corrective,
                'attachment' => $i->attachment_upload ? \Illuminate\Support\Facades\Storage::url($i->attachment_upload) : null,
                'involved' => $i->involvedStaff->map(fn ($x) => ['id' => $x->id, 'name' => $x->name, 'role' => $x->role])->values(),
                'reviewed_by' => optional($i->reviewedBy)->name,
                'responses' => $i->responses->map(fn ($r) => [
                    'id' => $r->id, 'type' => $r->type, 'message' => $r->message,
                    'by' => $r->staff_name, 'role' => $r->role_label, 'at' => optional($r->created_at)->format('Y-m-d H:i'),
                ])->values(),
            ];
        }

        return $row;
    }

    private function incidentQuery()
    {
        return \App\Models\Incident::with([
                'project:id,name,company_id', 'subcontractor:id,name', 'incidentType:id,name', 'injuryType:id,name',
                'reportedBy:id,name', 'responsibleBy:id,name', 'reviewedBy:id,name', 'involvedStaff:id,name,role', 'responses',
            ])
            ->where('company_id', $this->companyId());
    }

    public function incidentsIndex(Request $request)
    {
        $f = $this->listFilters($request) + [
            'status' => $request->query('status', 'all'),
            'type' => $request->query('type', 'all'),
        ];

        $all = $this->incidentQuery()->get()->map(fn ($i) => $this->incidentRow($i));

        $base = $all->filter(function ($r) use ($f) {
            if ($f['project_id'] && (int) $r['project_id'] !== (int) $f['project_id']) return false;
            if ($f['type'] !== 'all' && (string) $r['type_id'] !== (string) $f['type']) return false;
            if ($f['from'] && ($r['day'] ?? '') < $f['from']) return false;
            if ($f['to'] && ($r['day'] ?? '') > $f['to']) return false;
            if ($f['q'] !== '') {
                $hay = $this->normalise(implode(' ', array_filter([
                    $r['project'], $r['subcon'], $r['type'], $r['injury'], $r['body_part'], $r['location'],
                    $r['description'], $r['reported_by'], $r['responsible'], $r['day'], '#' . $r['id'],
                ])));
                if (!str_contains($hay, $this->normalise($f['q']))) return false;
            }

            return true;
        });

        $counts = ['all' => $base->count()] + $base->countBy('status')->all();
        $rows = $f['status'] === 'all' ? $base : $base->where('status', $f['status']);
        $rows = $f['sort'] === 'oldest' ? $rows->sortBy('date') : $rows->sortByDesc('date');
        [$page, $meta] = $this->pageOf($rows->values(), $f['page']);

        return Inertia::render('Review/Incidents', [
            'incidents' => $page,
            'meta' => $meta,
            'counts' => $counts,
            'filters' => $f,
            'projects' => $this->projectOptions(),
            'types' => \App\Models\IncidentType::orderBy('name')->get(['id', 'name']),
        ]);
    }

    private function incidentOwn(int $id): \App\Models\Incident
    {
        return \App\Models\Incident::where('company_id', $this->companyId())->findOrFail($id);
    }

    private function logIncident(\App\Models\Incident $incident, string $type, ?string $message): void
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        \App\Models\IncidentResponse::create([
            'incident_id' => $incident->id,
            'staff_id' => $staff?->id,
            'staff_name' => $staff?->name ?? $user->name,
            'role_label' => (int) $user->role_id === 3 ? 'Manager' : 'Supervisor',
            'type' => $type,
            'message' => $message,
        ]);
    }

    /** A Supervisor reviews a submitted incident. */
    public function incidentRespond(Request $request, int $id)
    {
        abort_unless((int) Auth::user()->role_id === 4, 403, 'Only a Supervisor can review incidents.');
        $data = $request->validate(['message' => 'required|string|min:3|max:2000']);
        $incident = $this->incidentOwn($id);
        abort_unless(in_array(strtolower((string) $incident->status), ['', 'open'], true), 422, 'Only submitted incidents can be reviewed.');

        $this->logIncident($incident, 'reviewed', $data['message']);
        $incident->update(['status' => 'inprogress', 'review_by' => CompanyStaff::where('user_id', Auth::id())->value('id')]);

        return back()->with('success', 'Incident reviewed.');
    }

    /** A Supervisor approves an incident after review. */
    public function incidentClose(Request $request, int $id)
    {
        abort_unless((int) Auth::user()->role_id === 4, 403, 'Only a Supervisor can approve incidents.');
        $data = $request->validate(['message' => 'required|string|min:3|max:2000']);
        $incident = $this->incidentOwn($id);
        abort_unless(strtolower((string) $incident->status) === 'inprogress', 422, 'The incident must be reviewed before approval.');

        $this->logIncident($incident, 'approved', $data['message']);
        $incident->update(['status' => 'closed']);

        return back()->with('success', 'Incident approved.');
    }

    /** Manager reopens a closed incident. */
    public function incidentReopen(Request $request, int $id)
    {
        abort_unless((int) Auth::user()->role_id === 3, 403, 'Only a Manager can reopen an incident.');
        $data = $request->validate(['message' => 'nullable|string|max:2000']);
        $incident = $this->incidentOwn($id);
        abort_unless(strtolower((string) $incident->status) === 'closed', 422, 'Only a closed incident can be reopened.');

        $this->logIncident($incident, 'reopened', $data['message'] ?? null);
        $incident->update(['status' => 'inprogress']);

        return back()->with('success', 'Incident reopened.');
    }

    public function incidentShow(int $id)
    {
        $incident = $this->incidentQuery()->findOrFail($id);

        return Inertia::render('Review/IncidentShow', [
            'incident' => $this->incidentRow($incident, true),
            'can_review_incident' => (int) Auth::user()->role_id === 4,
            'can_reopen_incident' => (int) Auth::user()->role_id === 3,
        ]);
    }

    /** Full detail of one site visit: toolbox talk first, then its inspections. */
    public function visitShow(string $key)
    {
        $visit = \App\Support\VisitFeed::collect($this->companyId())->firstWhere('key', $key);
        abort_unless($visit, 404);

        return Inertia::render('Review/VisitShow', ['visit' => $visit] + $this->roleFlags());
    }

    /** Full detail of one toolbox talk: attendance, Safety Passport sampling and its calculation. */
    public function toolboxShow(int $id)
    {
        $t = \App\Models\ToolboxTalks::with([
                'project:id,name,company_id', 'CompanyStaff:id,name', 'categories:id,name',
                'attendees:id,name,role', 'verifier:id,name', 'approver:id,name',
            ])
            ->whereHas('project', fn ($q) => $q->where('company_id', $this->companyId()))
            ->findOrFail($id);

        return Inertia::render('Review/ToolboxShow', ['talk' => \App\Support\DetailRows::toolbox($t)]);
    }

    /** Full detail of one NC / CC case with its timeline. */
    public function caseShow(string $type, int $id)
    {
        $case = $this->findCase($type, $id);
        $case->load(\App\Support\CaseFeed::WITH);
        $row = \App\Support\CaseFeed::row($type, $case);

        $reviewer = $case->review_by ? CompanyStaff::where('id', $case->review_by)->value('name') : null;
        $inspection = $case->inspection;
        $row['reviewer'] = $reviewer;
        $row['visit_key'] = $inspection && $inspection->toolbox_talk_id ? 'talk-' . $inspection->toolbox_talk_id : null;
        $row['evaluation'] = $inspection?->evaluation;

        return Inertia::render('Review/CaseShow', ['item' => $row]);
    }

    /** Full detail of one inspection. */
    public function inspectionShow(int $id)
    {
        $i = Inspection::with([
                'project:id,name,company_id', 'topic:id,name,code,inspection_category_id', 'subconCompany:id,name',
                'inspector:id,name', 'verifier:id,name', 'approver:id,name', 'toolboxTalk:id,inspection_date,conducted',
                'non_conformance', 'client_complaint',
            ])
            ->where('company_id', $this->companyId())
            ->findOrFail($id);

        return Inertia::render('Review/InspectionShow', ['inspection' => \App\Support\DetailRows::inspection($i)] + $this->roleFlags());
    }

    private function findCase(string $type, int $id)
    {
        $case = CaseFeed::model($type)::with('inspection')->findOrFail($id);
        abort_unless((int) optional($case->inspection)->company_id === (int) $this->companyId(), 404);

        return $case;
    }

    /** Approve the subcontractor's reply - the case is closed. */
    public function closeCase(Request $request, string $type, int $id)
    {
        $case = $this->findCase($type, $id);
        abort_unless($case->subcon_response, 422, 'The subcontractor has not replied yet.');
        $data = $request->validate(['comment' => 'nullable|string|max:1000']);

        $case->update([
            'status' => 'closed',
            'date_close' => now(),
            'review_by' => CompanyStaff::where('user_id', Auth::id())->value('id'),
            'comment' => $data['comment'] ?? $case->comment,
            'return_reason' => null,
        ]);

        return back()->with('success', 'Case closed.');
    }

    /** Send the case back to the subcontractor leader for a better reply. */
    public function returnCase(Request $request, string $type, int $id)
    {
        $case = $this->findCase($type, $id);
        abort_if($case->status === 'closed', 422, 'This case is already closed.');
        $data = $request->validate(['reason' => 'required|string|max:1000']);

        $case->update([
            'return_reason' => $data['reason'],
            'review_by' => CompanyStaff::where('user_id', Auth::id())->value('id'),
        ]);

        return back()->with('success', 'Case returned to the subcontractor leader.');
    }
}
