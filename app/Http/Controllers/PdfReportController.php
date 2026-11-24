<?php

namespace App\Http\Controllers;

use App\Support\UploadedAssets;
use App\Models\ClientComplaint;
use App\Models\CompanyStaff;
use App\Models\Incident;
use App\Models\Inspection;
use App\Models\InspectionCategory;
use App\Models\InspectionReport;
use App\Models\MonthlyReport;
use App\Models\NoConformance;
use App\Models\PerformanceSetting;
use App\Models\Project;
use App\Models\ProjectAssign;
use App\Models\ToolboxTalks;
use App\Support\CaseFeed;
use App\Support\Spgpnc;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * PDF reports. Every report carries who generated it and two signature boxes:
 * Supervisor (tier 2) and Manager (tier 3). Names are filled in when the record
 * was already verified / approved by someone.
 *
 *  - Every report, complete / approved or not, can be generated at any time. Records that are not
 *    approved yet are marked as such in the PDF.
 */
class PdfReportController extends Controller
{
    private const MAX_PHOTOS = 6;
    private const EVALUATION_LABELS = ['good' => 'GOOD', 'poor' => 'POOR', 'nonconformance' => 'NONCONFORMANCE', 'clientcomplaint' => 'CLIENT COMPLAINT'];

    private function categoryTotals($categories, array $inspections)
    {
        return $categories->values()->mapWithKeys(fn ($name) => [$name => 0])
            ->merge(collect($inspections)->countBy(fn ($row) => $row['category'] ?? 'Uncategorized'));
    }

    private function user()
    {
        return Auth::user();
    }

    private function companyId()
    {
        return $this->user()->company_id;
    }

    private function isInspector(): bool
    {
        return in_array((int) $this->user()->role_id, [7, 8], true);
    }

    private function myStaffId()
    {
        return CompanyStaff::where('user_id', Auth::id())->value('id');
    }

    /**
     * An inspector may view (read-only) the report of their own record, or of any record on a project they are assigned to.
     * Editing stays limited to the owner elsewhere; a PDF only ever reads.
     */
    private function inspectorMayView($authorStaffId, $projectId): bool
    {
        $me = (int) $this->myStaffId();

        return $me > 0 && ((int) $authorStaffId === $me
            || ($projectId && ProjectAssign::where('entity_type', 'staff')->where('entity_id', $me)->where('project_id', $projectId)->exists()));
    }

    // ------------------------------------------------------------------ helpers

    private function staffName($id): ?string
    {
        return $id ? CompanyStaff::where('id', $id)->value('name') : null;
    }

    /** Shared data for the layout: company, creator, signature boxes. */
    private function meta(string $title, string $refNo, ?string $supervisor = null, ?string $supervisorAt = null, ?string $manager = null, ?string $managerAt = null): array
    {
        $user = $this->user();
        $user->loadMissing('company:id,name', 'role:id,name,display_name');
        $name = $this->staffName($this->myStaffId()) ?: $user->name;

        return [
            'docTitle' => $title,
            'refNo' => $refNo,
            'company' => optional($user->company)->name ?: config('app.name'),
            'companyLogo' => $this->image(optional($user->company)->logo_path, 200),
            'createdBy' => $name,
            'createdRole' => optional($user->role)->display_name ?: optional($user->role)->name,
            'createdAt' => now()->format('d M Y, H:i'),
            'supervisor' => ['name' => $supervisor, 'at' => $supervisorAt],
            'manager' => ['name' => $manager, 'at' => $managerAt],
        ];
    }

    /** Decode the photo column (JSON list or single path) into resized, embeddable data URIs. */
    private function photos($raw): array
    {
        $paths = json_decode((string) $raw, true);
        if (!is_array($paths)) {
            $paths = array_filter([$raw]);
        }

        $out = [];
        foreach (array_slice(array_values($paths), 0, self::MAX_PHOTOS) as $p) {
            if ($uri = $this->image($p)) {
                $out[] = $uri;
            }
        }

        return $out;
    }

    /** Read a stored image, shrink it and return a base64 data URI (null if unreadable). */
    private function image(?string $path, int $max = 800): ?string
    {
        if (!$path) {
            return null;
        }
        $path = preg_replace('#^/?storage/#', '', $path);
        if (!function_exists('imagecreatefromstring')) {
            return null;
        }

        try {
            $bytes = UploadedAssets::disk($path)->get($path);
            $img = $bytes ? @imagecreatefromstring($bytes) : false;
            if (!$img) {
                return null;
            }
            $w = imagesx($img);
            $h = imagesy($img);
            if (max($w, $h) > $max) {
                $r = $max / max($w, $h);
                $small = imagescale($img, (int) round($w * $r), (int) round($h * $r));
                imagedestroy($img);
                $img = $small;
            }
            // transparent PNG logos would turn black as a JPEG: flatten them on white first
            $flat = imagecreatetruecolor(imagesx($img), imagesy($img));
            imagefill($flat, 0, 0, imagecolorallocate($flat, 255, 255, 255));
            imagecopy($flat, $img, 0, 0, 0, 0, imagesx($img), imagesy($img));
            imagedestroy($img);
            $img = $flat;
            ob_start();
            imagejpeg($img, null, 78);
            $data = ob_get_clean();
            imagedestroy($img);

            return 'data:image/jpeg;base64,' . base64_encode($data);
        } catch (\Throwable $e) {
            report($e);

            return null;
        }
    }

    private function render(string $view, array $data, string $filename)
    {
        if (request()->boolean('preview')) {
            return response()->view('pdf.preview')->header('Cache-Control', 'private, no-store');
        }

        @ini_set('memory_limit', '512M');
        @set_time_limit(120);

        $pdf = Pdf::loadView($view, $data)->setPaper('a4', 'portrait');
        if (in_array($view, ['pdf.daily', 'pdf.visit'], true)) {
            $pdf->render();
            $this->addInspectionReportFooter($pdf->getDomPDF()->getCanvas());
        }

        return $pdf->stream(str_replace(['/', '\\'], '-', $filename) . '.pdf');
    }

    private function addInspectionReportFooter(\Dompdf\Canvas $canvas): void
    {
        $canvas->page_script(function ($page, $total, $pageCanvas, $fonts) {
            $margin = 14 * 72 / 25.4;
            $bottom = $pageCanvas->get_height();
            $right = $pageCanvas->get_width() - $margin;
            $regular = $fonts->getFont('DejaVu Sans', 'normal');
            if ($page === $total) {
                $attribution = 'Report generated by Safety Buddy – CMERI | www.sbcmeri.com';
                $width = $fonts->getTextWidth($attribution, $regular, 8);
                $pageCanvas->text(($pageCanvas->get_width() - $width) / 2, $bottom - 24, $attribution, $regular, 8, [0.28, 0.33, 0.41]);
            }
            $label = (string) $page;
            $pageCanvas->text($right - $fonts->getTextWidth($label, $regular, 8), $bottom - 24, $label, $regular, 8, [0.28, 0.33, 0.41]);
        });
    }

    private function ts($d, string $fmt = 'd M Y, H:i'): ?string
    {
        return $d ? $d->format($fmt) : null;
    }

    // ------------------------------------------------------------------ inspection

    private function findInspection(int $id): Inspection
    {
        $i = Inspection::with(['project', 'topic', 'subconCompany', 'inspector', 'verifier', 'approver', 'non_conformance', 'client_complaint'])
            ->where('company_id', $this->companyId())
            ->findOrFail($id);

        if ($this->isInspector()) {
            abort_unless($this->inspectorMayView($i->inspection_by, $i->project_id), 403);
        }

        return $i;
    }

    public function inspection(int $id)
    {
        $i = $this->findInspection($id);
        $category = $i->topic?->inspection_category_id
            ? \App\Models\InspectionCategory::where('id', $i->topic->inspection_category_id)->value('name')
            : null;

        $ref = $i->code ?: 'INS-' . str_pad($i->id, 5, '0', STR_PAD_LEFT);

        return $this->render('pdf.inspection', [
            'i' => $i,
            'category' => $category,
            'photos' => $this->photos($i->photo),
        ] + $this->meta('Inspection Report' . ($i->status === Inspection::STATUS_APPROVED ? '' : ' (NOT APPROVED YET)'), $ref, optional($i->verifier)->name, $this->ts($i->verified_at), optional($i->approver)->name, $this->ts($i->approved_at)), $ref);
    }

    // ------------------------------------------------------------------ toolbox talk

    public function toolbox(int $id)
    {
        $t = ToolboxTalks::with(['project', 'CompanyStaff', 'categories:id,name', 'topics:id,name', 'attendees:id,name,role', 'inspections.topic:id,name', 'inspections.subconCompany:id,name'])
            ->whereHas('project', fn ($q) => $q->where('company_id', $this->companyId()))
            ->findOrFail($id);

        if ($this->isInspector()) {
            abort_unless($this->inspectorMayView($t->inspection_by, $t->project_id), 403);
        }

        $ref = $t->code ?: 'TBT-' . str_pad($t->id, 5, '0', STR_PAD_LEFT);

        return $this->render('pdf.toolbox', [
            't' => $t,
            'imgGroup' => $this->image($t->img_group),
            'imgAttendance' => $this->image($t->img_attendance),
        ] + $this->meta('Toolbox Talk Report' . ($t->status === Inspection::STATUS_APPROVED ? '' : ' (NOT APPROVED YET)'), $ref, $this->staffName($t->verified_by), $this->ts($t->verified_at), $this->staffName($t->approved_by), $this->ts($t->approved_at)), $ref);
    }


    // ------------------------------------------------------------------ full site visit (toolbox talk + inspections)

    public function visit(string $key)
    {
        preg_match('/^(talk|insp)-(\d+)$/', $key, $m) || abort(404);
        $with = ['project', 'topic', 'subconCompany', 'inspector', 'verifier', 'approver', 'non_conformance', 'client_complaint'];
        $mine = $this->isInspector();

        if ($m[1] === 'talk') {
            $t = ToolboxTalks::with(['project', 'CompanyStaff', 'categories:id,name', 'topics:id,name', 'attendees:id,name,role', 'inspections.topic:id,name', 'inspections.subconCompany:id,name'])
                ->whereHas('project', fn ($q) => $q->where('company_id', $this->companyId()))
                ->findOrFail($m[2]);
            $mine && abort_unless($this->inspectorMayView($t->inspection_by, $t->project_id), 403);
            $list = Inspection::with($with)->where('toolbox_talk_id', $t->id)->orderBy('id')->get();
            $project = optional($t->project)->name;
            $by = optional($t->CompanyStaff)->name;
            $date = optional($t->inspection_date)->format('d M Y');
        } else {
            $t = null;
            $one = Inspection::with($with)->where('company_id', $this->companyId())->findOrFail($m[2]);
            abort_if($one->toolbox_talk_id, 404);
            $mine && abort_unless($this->inspectorMayView($one->inspection_by, $one->project_id), 403);
            $list = collect([$one]);
            $project = optional($one->project)->name;
            $by = optional($one->inspector)->name;
            $date = optional($one->inspection_date)->format('d M Y');
        }

        $statuses = $list->pluck('status')->when($t, fn ($c) => $c->push($t->status));
        abort_unless($statuses->isNotEmpty(), 404);

        $categories = InspectionCategory::orderBy('sort_order')->orderBy('name')->pluck('name', 'id');
        $inspections = $list->map(fn ($i) => [
            'i' => $i,
            'category' => $categories->get($i->topic?->inspection_category_id ?? 0),
            'photos' => $this->photos($i->photo),
        ])->all();

        // signatures: the people who verified / approved the visit
        $talkVerifier = $t ? $this->staffName($t->verified_by) : null;
        $talkApprover = $t ? $this->staffName($t->approved_by) : null;
        $verifiedInspection = $list->first(fn ($inspection) => $inspection->verifier);
        $approvedInspection = $list->first(fn ($inspection) => $inspection->approver);

        $ref = ($t ?: $one)->code ?: 'SV-' . strtoupper($m[1]) . '-' . str_pad($m[2], 5, '0', STR_PAD_LEFT);
        $settings = PerformanceSetting::where('company_id', $this->companyId())->first()?->snapshot() ?? Spgpnc::DEFAULTS;
        $evaluations = $list->countBy('evaluation');
        $performance = Spgpnc::score($t?->sp_sampled, $t?->sp_not_registered, [
            'good' => $evaluations->get('good', 0),
            'poor' => $evaluations->get('poor', 0),
            'nc' => $evaluations->get('nonconformance', 0),
            'cc' => $evaluations->get('clientcomplaint', 0),
        ], $settings);

        return $this->render('pdf.visit', [
            't' => $t,
            'project' => $project,
            'by' => $by,
            'inspectors' => $by,
            'date' => $date,
            'inspections' => $inspections,
            'categoryTotals' => $this->categoryTotals($categories, $inspections),
            'evaluationLabels' => self::EVALUATION_LABELS,
            'evaluations' => $evaluations,
            'settings' => $settings,
            'performance' => $performance,
            'supervisorApproved' => $statuses->every(fn ($status) => in_array($status, [Inspection::STATUS_VERIFIED, Inspection::STATUS_APPROVED], true)),
            'managerApproved' => $statuses->every(fn ($status) => $status === Inspection::STATUS_APPROVED),
            'imgGroup' => $t ? $this->image($t->img_group) : null,
            'imgAttendance' => $t ? $this->image($t->img_attendance) : null,
            'overallStatus' => $statuses->contains(Inspection::STATUS_REJECTED) ? Inspection::STATUS_REJECTED : ($statuses->every(fn ($s) => $s === Inspection::STATUS_APPROVED) ? Inspection::STATUS_APPROVED : ($statuses->contains(fn ($s) => !$s || $s === Inspection::STATUS_PENDING) ? Inspection::STATUS_PENDING : Inspection::STATUS_VERIFIED)),
        ] + $this->meta(
            'Toolbox Talk, SP Sampling & Inspection Report' . ($statuses->every(fn ($s) => $s === Inspection::STATUS_APPROVED) ? '' : ' (NOT APPROVED YET)'),
            $ref,
            $talkVerifier ?? $verifiedInspection?->verifier?->name,
            $this->ts($talkVerifier ? $t->verified_at : $verifiedInspection?->verified_at),
            $talkApprover ?? $approvedInspection?->approver?->name,
            $this->ts($talkApprover ? $t->approved_at : $approvedInspection?->approved_at)
        ), $ref);
    }

    // ------------------------------------------------------------------ company manhour (by day, project, subcontractor)

    public function manhour(Request $request)
    {
        $f = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'project_id' => 'nullable|integer',
            'subcon_id' => 'nullable|integer',
        ]);

        $rows = \App\Models\Manhour::with(['project:id,name', 'subcontractor:id,name'])
            ->where('company_id', $this->companyId())
            ->when($this->isInspector(), fn ($q) => $q->whereIn('project_id', ProjectAssign::where('entity_type', 'staff')->where('entity_id', $this->myStaffId())->pluck('project_id')))
            ->when(!empty($f['from']), fn ($q) => $q->whereDate('work_date', '>=', $f['from']))
            ->when(!empty($f['to']), fn ($q) => $q->whereDate('work_date', '<=', $f['to']))
            ->when(!empty($f['project_id']), fn ($q) => $q->where('project_id', $f['project_id']))
            ->when(!empty($f['subcon_id']), fn ($q) => $q->where('subcon_company_id', $f['subcon_id']))
            ->orderBy('work_date')->orderBy('project_id')->orderBy('subcon_company_id')
            ->get()
            ->map(fn ($m) => [
                'date' => $m->work_date->format('Y-m-d'),
                'project' => optional($m->project)->name ?: '-',
                'subcon' => optional($m->subcontractor)->name ?: '-',
                'workers' => (int) $m->worker_count,
                'hours' => (float) $m->working_hours,
                'manhours' => round($m->worker_count * (float) $m->working_hours, 2),
            ]);

        $sum = fn ($c) => ['workers' => $c->sum('workers'), 'manhours' => round($c->sum('manhours'), 2), 'entries' => $c->count()];
        $filters = array_filter([
            'Period' => ($f['from'] ?? null) || ($f['to'] ?? null) ? (($f['from'] ?? null) ?: 'start') . ' to ' . (($f['to'] ?? null) ?: 'latest') : null,
            'Project' => !empty($f['project_id']) ? Project::where('id', $f['project_id'])->value('name') : null,
            'Subcontractor' => !empty($f['subcon_id']) ? \App\Models\SubconCompany::where('id', $f['subcon_id'])->value('name') : null,
        ]);

        $ref = 'MH-' . now()->format('Ymd-His');

        return $this->render('pdf.manhour', [
            'filters' => $filters,
            'total' => $sum($rows),
            'days' => $rows->groupBy('date')->map(fn ($g, $d) => ['date' => $d, 'rows' => $g->values()] + $sum($g))->values(),
            'byProject' => $rows->groupBy('project')->map(fn ($g, $k) => ['name' => $k] + $sum($g))->sortBy('name')->values(),
            'bySubcon' => $rows->groupBy('subcon')->map(fn ($g, $k) => ['name' => $k] + $sum($g))->sortBy('name')->values(),
        ] + $this->meta('Manhour Report', $ref), $ref);
    }
    // ------------------------------------------------------------------ NC / CC

    public function caseReport(string $type, int $id)
    {
        $case = CaseFeed::model($type)::with('inspection')->findOrFail($id);
        $inspection = $case->inspection;
        abort_unless($inspection && (int) $inspection->company_id === (int) $this->companyId(), 404);

        if ($this->isInspector()) {
            abort_unless($this->inspectorMayView($inspection->inspection_by, $inspection->project_id), 403);
        }

        $case->load(CaseFeed::WITH);
        $row = CaseFeed::row($type, $case);
        $inspection = $case->inspection;
        $photos = $this->photos($inspection->photo);
        $ref = $case->code ?: strtoupper($type) . '-' . str_pad($case->id, 5, '0', STR_PAD_LEFT);
        $title = $type === 'nc' ? 'Non-Conformance Report' : 'Client Complaint Report';

        return $this->render('pdf.case', [
            'c' => $row,
            'title' => $title,
            'evaluation' => $inspection->evaluation,
            'photos' => $photos,
        ] + $this->meta(
            $title . ($case->status === 'closed' ? '' : ' (NOT CLOSED YET)'), $ref,
            $this->staffName($case->review_by) ?: optional($inspection->verifier)->name,
            $this->ts($case->date_close ?: $case->updated_at),
            optional($inspection->approver)->name,
            $this->ts($inspection->approved_at)
        ), $ref);
    }

    // ------------------------------------------------------------------ attendance

    public function attendance(Request $request)
    {
        $data = $request->validate([
            'date' => 'nullable|date',
            'project_id' => 'nullable|integer',
        ]);
        $date = $data['date'] ?? now()->toDateString();

        $projects = Project::where('company_id', $this->companyId())
            ->when(!empty($data['project_id']), fn ($q) => $q->where('id', $data['project_id']))
            ->when($this->isInspector(), function ($q) {
                $assigned = ProjectAssign::where('entity_type', 'staff')->where('entity_id', $this->myStaffId())->pluck('project_id');
                $q->whereIn('id', $assigned);
            })
            ->orderBy('name')->get(['id', 'name']);

        $rows = DB::table('manhour_attendances as a')
            ->join('subcon_staff as st', 'st.id', '=', 'a.subcon_staff_id')
            ->join('subcon_company as c', 'c.id', '=', 'a.subcon_company_id')
            ->whereIn('a.project_id', $projects->pluck('id'))
            ->where('a.work_date', $date)
            ->orderBy('c.name')->orderBy('st.name')
            ->get(['a.project_id', 'a.subcon_company_id', 'c.name as subcon', 'st.name as staff', 'st.role', 'a.hours']);

        // series code of each day's attendance entry (project + subcontractor)
        $codes = \App\Models\Manhour::whereIn('project_id', $projects->pluck('id'))
            ->where('work_date', $date)
            ->get(['project_id', 'subcon_company_id', 'code'])
            ->mapWithKeys(fn ($m) => [$m->project_id . ':' . $m->subcon_company_id => $m->code]);

        $groups = $projects->map(fn ($p) => [
            'project' => $p->name,
            'subcons' => $rows->where('project_id', $p->id)->groupBy('subcon_company_id')->map(fn ($g, $subconId) => [
                'series_code' => $codes[$p->id . ':' . $subconId] ?? null,
                'name' => $g->first()->subcon,
                'manhours' => (float) $g->sum('hours'),
                'staff' => $g->map(fn ($r) => ['name' => $r->staff, 'role' => $r->role, 'hours' => (float) $r->hours])->values(),
            ])->values(),
        ])->filter(fn ($g) => $g['subcons']->isNotEmpty())->values();

        $entryCodes = $groups->flatMap(fn ($g) => $g['subcons']->pluck('series_code'))->filter()->values();
        $ref = $entryCodes->count() === 1 ? $entryCodes->first() : 'ATT-' . str_replace('-', '', $date);

        return $this->render('pdf.attendance', [
            'date' => $date,
            'groups' => $groups,
            'totalWorkers' => $rows->count(),
            'totalHours' => (float) $rows->sum('hours'),
        ] + $this->meta('Daily Attendance Report', $ref), $ref);
    }

    // ------------------------------------------------------------------ incident

    public function incident(int $id)
    {
        $i = Incident::with([
            'project:id,name', 'subcontractor:id,name', 'incidentType:id,name', 'injuryType:id,name',
            'reportedBy:id,name', 'responsibleBy:id,name', 'reviewedBy:id,name', 'involvedStaff:id,name,role', 'responses',
        ])->where('company_id', $this->companyId())->findOrFail($id);

        if ($this->isInspector()) {
            abort_unless($this->inspectorMayView($i->reported_by, $i->project_id), 403);
        }

        $ref = $i->code ?: 'INC-' . str_pad($i->id, 5, '0', STR_PAD_LEFT);

        return $this->render('pdf.incident', [
            'i' => $i,
            'attachment' => $this->image($i->attachment_upload),
        ] + $this->meta('Incident Report', $ref, optional($i->reviewedBy)->name, null, null, null), $ref);
    }

    // ------------------------------------------------------------------ daily / monthly performance

    public function daily(int $id)
    {
        $perf = app(PerformanceController::class);
        $r = $perf->freshDaily($id); // always the current figures of the day
        [$projects, $subcons] = $perf->names(collect([$r]));
        $row = $perf->dailyRow($r, $projects, $subcons, true);

        $day = Inspection::with(['verifier:id,name', 'approver:id,name'])
            ->where('project_id', $r->project_id)->where('subcon_company_id', $r->subcon_company_id)
            ->whereDate('inspection_date', $r->report_date)->get();
        $ver = $day->first(fn ($x) => $x->verified_by);
        $apr = $day->first(fn ($x) => $x->approved_by);

        $ref = $r->report_no ?: 'DR-' . str_pad($r->id, 5, '0', STR_PAD_LEFT);

        // every inspection and toolbox talk of that day (approved or not), with their photos
        $categories = InspectionCategory::orderBy('sort_order')->orderBy('name')->pluck('name', 'id');
        $inspections = Inspection::with(['project', 'topic', 'subconCompany', 'inspector', 'non_conformance', 'client_complaint'])
            ->where('project_id', $r->project_id)->where('subcon_company_id', $r->subcon_company_id)
            ->whereDate('inspection_date', $r->report_date)
            ->orderBy('id')->get()
            ->map(fn ($i) => [
                'i' => $i,
                'category' => $categories->get($i->topic?->inspection_category_id ?? 0),
                'photos' => $this->photos($i->photo),
            ])->all();

        $talks = ToolboxTalks::with(['project', 'CompanyStaff', 'categories:id,name', 'topics:id,name', 'attendees:id,name,role', 'inspections.topic:id,name', 'inspections.subconCompany:id,name'])
            ->where('project_id', $r->project_id)
            ->whereDate('inspection_date', $r->report_date)
            ->orderBy('id')->get()
            ->map(fn ($t) => [
                't' => $t,
                'imgGroup' => $this->image($t->img_group),
                'imgAttendance' => $this->image($t->img_attendance),
            ])->all();

        return $this->render('pdf.daily', [
            'r' => $row,
            'inspections' => $inspections,
            'talks' => $talks,
            'inspectors' => collect($inspections)->map(fn ($finding) => $finding['i']->inspector?->name)->filter()->unique()->implode(', '),
            'categoryTotals' => $this->categoryTotals($categories, $inspections),
            'evaluationLabels' => self::EVALUATION_LABELS,
            'evaluations' => collect($inspections)->countBy(fn ($finding) => $finding['i']->evaluation),
            'settings' => $row['settings'],
            'performance' => $row,
        ] + $this->meta(
            'Daily Inspection Report', $ref,
            optional(optional($ver)->verifier)->name, $this->ts(optional($ver)->verified_at),
            $row['reviewed_by'] ?? optional(optional($apr)->approver)->name, $this->ts(optional($apr)->approved_at)
        ), $ref);
    }

    public function monthly(int $id)
    {
        $perf = app(PerformanceController::class);
        $m = $perf->freshMonthly($id);
        [$projects, $subcons] = $perf->names(collect([$m]));
        $row = $perf->monthlyRow($m, $projects, $subcons, true);

        $ref = $m->report_no ?: 'MR-' . str_pad($m->id, 5, '0', STR_PAD_LEFT);

        $periodStart = \Carbon\Carbon::parse($m->period . '-01')->startOfMonth();
        $inspectionSummary = Inspection::with(['inspector:id,name', 'topic:id,name', 'subconCompany:id,name'])
            ->where('company_id', $this->companyId())
            ->where('project_id', $m->project_id)
            ->where('subcon_company_id', $m->subcon_company_id)
            ->whereBetween('inspection_date', [$periodStart, $periodStart->copy()->endOfMonth()])
            ->orderBy('inspection_date')->orderBy('id')->get();

        $toolboxSummary = ToolboxTalks::with(['CompanyStaff:id,name', 'topics:id,name', 'categories:id,name'])
            ->whereHas('project', fn ($query) => $query->where('company_id', $this->companyId()))
            ->where('project_id', $m->project_id)
            ->whereBetween('inspection_date', [$periodStart, $periodStart->copy()->endOfMonth()])
            ->orderBy('inspection_date')->orderBy('id')->get();

        $monthEnd = $periodStart->copy()->endOfMonth();

        // incidents of this contractor on this project during the month
        $incidents = Incident::with(['incidentType:id,name', 'injuryType:id,name'])
            ->where('company_id', $this->companyId())
            ->where('project_id', $m->project_id)
            ->where('subcon_company_id', $m->subcon_company_id)
            ->whereBetween('incident_date', [$periodStart, $monthEnd])
            ->orderBy('incident_date')->orderBy('id')->get();

        // man-hours of this contractor on this project during the month (workers x hours of each day)
        $manhourDays = \App\Models\Manhour::where('company_id', $this->companyId())
            ->where('project_id', $m->project_id)
            ->where('subcon_company_id', $m->subcon_company_id)
            ->whereBetween('work_date', [$periodStart->toDateString(), $monthEnd->toDateString()])
            ->orderBy('work_date')->get()
            ->map(fn ($d) => [
                'date' => $d->work_date->format('Y-m-d'),
                'workers' => (int) $d->worker_count,
                'hours' => (float) $d->working_hours,
                'manhours' => round($d->worker_count * (float) $d->working_hours, 2),
            ]);
        $totalManhours = round($manhourDays->sum('manhours'), 2);

        // Cumulative LTIFR from January of the report year up to this month:
        // (total LTI cases to date x 1,000,000) / total man-hours worked to date
        $yearStart = $periodStart->copy()->startOfYear();
        $mhByMonth = \App\Models\Manhour::where('company_id', $this->companyId())
            ->where('project_id', $m->project_id)
            ->where('subcon_company_id', $m->subcon_company_id)
            ->whereBetween('work_date', [$yearStart->toDateString(), $monthEnd->toDateString()])
            ->get()->groupBy(fn ($d) => (int) $d->work_date->format('n'))
            ->map(fn ($g) => round($g->sum(fn ($d) => $d->worker_count * (float) $d->working_hours), 2));
        $ltiByMonth = Incident::where('company_id', $this->companyId())
            ->where('project_id', $m->project_id)
            ->where('subcon_company_id', $m->subcon_company_id)
            ->whereBetween('incident_date', [$yearStart, $monthEnd])
            ->get()->groupBy(fn ($i) => (int) $i->incident_date->format('n'))
            ->map(fn ($g) => (int) $g->sum('lti_worker_count'));
        $cumMh = 0;
        $cumLti = 0;
        $ltifrRows = [];
        for ($mo = 1; $mo <= (int) $periodStart->format('n'); $mo++) {
            $mh = (float) ($mhByMonth[$mo] ?? 0);
            $lti = (int) ($ltiByMonth[$mo] ?? 0);
            $cumMh += $mh;
            $cumLti += $lti;
            $ltifrRows[] = [
                'month' => \Carbon\Carbon::create($periodStart->year, $mo, 1)->format('M'),
                'manhours' => $mh, 'lti' => $lti, 'cum_manhours' => $cumMh, 'cum_lti' => $cumLti,
                'ltifr' => $cumMh > 0 ? round($cumLti * 1000000 / $cumMh, 2) : null,
            ];
        }

        $company = \App\Models\Company::find($this->companyId());

        return $this->render('pdf.monthly', [
            'ltifrRows' => $ltifrRows,
            'r' => $row,
            'inspectionSummary' => $inspectionSummary,
            'toolboxSummary' => $toolboxSummary,
            'charts' => \App\Support\MonthlyReportCharts::forReport($m),
            'incidents' => $incidents,
            'manhourDays' => $manhourDays,
            'totalManhours' => $totalManhours,
            // incidents per 100,000 man-hours; not available until man-hours are recorded
            'incidentRate' => $totalManhours > 0 ? round($incidents->count() * 100000 / $totalManhours, 2) : null,
            'companyName' => optional($company)->name,
            'logo' => $this->image(optional($company)->logo_path, 400),
        ] + $this->meta(
            'Monthly Inspection Report', $ref,
            // no manual sign-off: the report completes by itself once every daily report is complete
            null, null, $row['completed_at'] ? 'Automatic (all sections complete)' : null, $row['completed_at']
        ), $ref);
    }
}
