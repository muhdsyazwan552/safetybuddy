<?php
// app/Http/Controllers/Inspector/DashboardController.php

namespace App\Http\Controllers\Inspector;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Inspection;
use App\Models\SubconCompany;
use App\Models\SubconStaff;
use App\Models\ToolboxTalks;
use App\Models\CompanyStaff;
use App\Models\ProjectAssign;
use App\Models\ToolboxTopic;
use App\Models\NoConformance;
use App\Models\ClientComplaint;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Show inspector dashboard
     */
    public function index()
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        if (!$staff) {
            return $this->renderEmptyDashboard($user);
        }

        // Get assigned project IDs
        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        // Get statistics
        $stats = [
            'total_projects' => $assignedProjectIds->count(),
            'active_projects' => Project::whereIn('id', $assignedProjectIds)->where('status', 'active')->count(),
            'total_inspections' => Inspection::whereIn('project_id', $assignedProjectIds)->count(),
            'nonconformance_count' => Inspection::whereIn('project_id', $assignedProjectIds)->where('evaluation', 'nonconformance')->count(),
            'client_complaint_count' => Inspection::whereIn('project_id', $assignedProjectIds)->where('evaluation', 'clientcomplaint')->count(),
            'total_toolbox_talks' => ToolboxTalks::whereIn('project_id', $assignedProjectIds)->count(),
            'active_subcons' => SubconCompany::where('status', 'active')->count(),
        ];

        // Get recent inspections
        $recentInspections = Inspection::with(['project', 'subconCompany', 'topic'])
            ->whereIn('project_id', $assignedProjectIds)
            ->orderBy('inspection_date', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($inspection) {
                return [
                    'id' => $inspection->id,
                    'project_name' => $inspection->project->name ?? 'N/A',
                    'subcon_name' => $inspection->subconCompany->name ?? 'Main Company',
                    'topic' => $inspection->topic->title ?? 'N/A',
                    'evaluation' => $inspection->evaluation,
                    'inspection_date' => $inspection->inspection_date ? $inspection->inspection_date->format('Y-m-d') : 'N/A',
                    'location' => $inspection->location,
                ];
            });

        // Get projects
        $projects = Project::whereIn('id', $assignedProjectIds)
            ->withCount('inspections')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'location' => $project->location,
                    'status' => $project->status,
                    'progress' => $project->progress,
                    'inspection_count' => $project->inspections_count,
                ];
            });

        // Get evaluation statistics
        $evaluationStats = Inspection::select('evaluation', DB::raw('count(*) as total'))
            ->whereIn('project_id', $assignedProjectIds)
            ->groupBy('evaluation')
            ->get();

        // Get recent toolbox talks
        $recentToolboxTalks = ToolboxTalks::with(['project', 'CompanyStaff'])
            ->whereIn('project_id', $assignedProjectIds)
            ->orderBy('inspection_date', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($talk) {
                return [
                    'id' => $talk->id,
                    'project_name' => $talk->project->name ?? 'N/A',
                    'conducted_by' => $talk->CompanyStaff->name ?? 'N/A',
                    'total_attended' => $talk->total_attended,
                    'inspection_date' => $talk->inspection_date ? $talk->inspection_date->format('Y-m-d') : 'N/A',
                ];
            });

        // ---- Insights (new dashboard widgets) ----
        $inspectionsQuery = fn () => Inspection::whereIn('project_id', $assignedProjectIds);
        $startOfWeek = now()->startOfWeek();
        $totalEvaluated = $inspectionsQuery()->count();
        $goodCount = $inspectionsQuery()->where('evaluation', 'good')->count();

        $openNc = NoConformance::where('status', 'open')
            ->whereHas('inspection', fn ($q) => $q->whereIn('project_id', $assignedProjectIds))
            ->count();
        $openCc = ClientComplaint::where('status', 'open')
            ->whereHas('inspection', fn ($q) => $q->whereIn('project_id', $assignedProjectIds))
            ->count();

        $insights = [
            'today_inspections' => $inspectionsQuery()->whereDate('inspection_date', now()->toDateString())->count(),
            'week_inspections' => $inspectionsQuery()->where('inspection_date', '>=', $startOfWeek)->count(),
            'last_week_inspections' => $inspectionsQuery()
                ->whereBetween('inspection_date', [$startOfWeek->copy()->subWeek(), $startOfWeek])
                ->count(),
            'compliance_rate' => $totalEvaluated > 0 ? round(($goodCount / $totalEvaluated) * 100) : 0,
            'open_nc' => $openNc,
            'open_cc' => $openCc,
            'toolbox_this_month' => ToolboxTalks::whereIn('project_id', $assignedProjectIds)
                ->whereYear('inspection_date', now()->year)
                ->whereMonth('inspection_date', now()->month)
                ->count(),
        ];

        // Last 7 days activity (inspections per day)
        $perDay = $inspectionsQuery()
            ->where('inspection_date', '>=', now()->subDays(6)->startOfDay())
            ->get(['inspection_date'])
            ->groupBy(fn ($i) => $i->inspection_date->format('Y-m-d'))
            ->map->count();

        $weeklyActivity = collect(range(6, 0))->map(function ($daysAgo) use ($perDay) {
            $date = now()->subDays($daysAgo);
            return [
                'date' => $date->format('Y-m-d'),
                'label' => $date->format('D'),
                'count' => (int) ($perDay[$date->format('Y-m-d')] ?? 0),
                'is_today' => $daysAgo === 0,
            ];
        })->values();

        // Open items that need follow-up (latest first)
        $attention = collect()
            ->merge(
                NoConformance::with('inspection.project', 'inspection.subconCompany')
                    ->where('status', 'open')
                    ->whereHas('inspection', fn ($q) => $q->whereIn('project_id', $assignedProjectIds))
                    ->latest()->limit(5)->get()
                    ->map(fn ($r) => [
                        'type' => 'Non-Conformance',
                        'inspection_id' => $r->inspection_id,
                        'project_name' => $r->inspection->project->name ?? 'N/A',
                        'subcon_name' => $r->inspection->subconCompany->name ?? 'Main Company',
                        'date_open' => $r->date_open ? $r->date_open->format('d M Y') : null,
                        'sort' => optional($r->created_at)->timestamp ?? 0,
                    ])
            )
            ->merge(
                ClientComplaint::with('inspection.project', 'inspection.subconCompany')
                    ->where('status', 'open')
                    ->whereHas('inspection', fn ($q) => $q->whereIn('project_id', $assignedProjectIds))
                    ->latest()->limit(5)->get()
                    ->map(fn ($r) => [
                        'type' => 'Client Complaint',
                        'inspection_id' => $r->inspection_id,
                        'project_name' => $r->inspection->project->name ?? 'N/A',
                        'subcon_name' => $r->inspection->subconCompany->name ?? 'Main Company',
                        'date_open' => $r->date_open ? $r->date_open->format('d M Y') : null,
                        'sort' => optional($r->created_at)->timestamp ?? 0,
                    ])
            )
            ->sortByDesc('sort')->take(5)->values();

        return Inertia::render('Inspector/Dashboard', [
            'stats' => $stats,
            'recentInspections' => $recentInspections,
            'projects' => $projects,
            'evaluationStats' => $evaluationStats,
            'recentToolboxTalks' => $recentToolboxTalks,
            'insights' => $insights,
            'weeklyActivity' => $weeklyActivity,
            'attention' => $attention,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'staff' => $staff,
            ]
        ]);
    }

    protected function renderEmptyDashboard($user)
    {
        return Inertia::render('Inspector/Dashboard', [
            'stats' => [
                'total_projects' => 0,
                'active_projects' => 0,
                'total_inspections' => 0,
                'nonconformance_count' => 0,
                'client_complaint_count' => 0,
                'total_toolbox_talks' => 0,
                'active_subcons' => 0,
            ],
            'recentInspections' => [],
            'projects' => [],
            'evaluationStats' => [],
            'recentToolboxTalks' => [],
            'insights' => [],
            'weeklyActivity' => [],
            'attention' => [],
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'staff' => null,
            ]
        ]);
    }

    // ==================== INSPECTION METHODS ====================

    /**
     * Show inspections list page
     */
    public function inspections(Request $request)
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        if (!$staff) {
            return redirect()->back()->with('error', 'Staff record not found');
        }

        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        $query = Inspection::with(['project', 'subconCompany', 'topic', 'inspector'])
            ->whereIn('project_id', $assignedProjectIds);

        if ($request->evaluation) {
            $query->where('evaluation', $request->evaluation);
        }

        if ($request->project_id) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->subcon_company_id) {
            $query->where('subcon_company_id', $request->subcon_company_id);
        }

        if ($request->start_date) {
            $query->whereDate('inspection_date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->whereDate('inspection_date', '<=', $request->end_date);
        }

        $inspections = $query->orderBy('inspection_date', 'desc')->paginate(7);

        $projects = Project::whereIn('id', $assignedProjectIds)->select('id', 'name')->get();
        $subconCompanies = SubconCompany::where('status', 'active')->get();
        $evaluations = Inspection::$evaluationOptions;

        return Inertia::render('Inspector/Inspections', [
            'inspections' => $inspections,
            'projects' => $projects,
            'subconCompanies' => $subconCompanies,
            'evaluations' => $evaluations,
            'filters' => $request->only(['evaluation', 'project_id', 'subcon_company_id', 'start_date', 'end_date']),
            'user' => $user,
        ]);
    }

    /**
     * Show create inspection form
     */
    public function createInspection()
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        if (!$staff) {
            return redirect()->back()->with('error', 'Staff record not found');
        }

        // Get projects assigned to this staff
        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        $projects = Project::whereIn('id', $assignedProjectIds)->get()->map(function ($project) {
            // Get subcon companies (compsub type) assigned to this project
            $subconCompanyIds = ProjectAssign::where('entity_type', 'compsub')  // Changed from 'subcon' to 'compsub'
                ->where('project_id', $project->id)
                ->pluck('entity_id')
                ->unique();

            $subconCompanies = SubconCompany::whereIn('id', $subconCompanyIds)
                ->orderBy('name')
                ->select('id', 'name', 'email', 'contact', 'status')
                ->get();

            // Add subcon companies to project object
            $project->subcon_companies = $subconCompanies;

            return $project;
        });

        $categories = \App\Models\InspectionCategory::catalogue();
        $evaluations = Inspection::$evaluationOptions;

        return Inertia::render('Inspector/CreateInspection', [
            'projects' => $projects,
            'categories' => $categories,
            'evaluations' => $evaluations,
            'user' => $user,
            'staffId' => $staff->id,
        ]);
    }

    // ------------------------------------------------------------------ site visit (toolbox + inspection)

    /** Projects (with subcontractors) the logged-in inspector is assigned to. */
    private function visitProjects($staff, bool $allOfCompany = false, $companyId = null)
    {
        $query = $allOfCompany
            ? Project::where('company_id', $companyId)
            : Project::whereIn('id', ProjectAssign::where('entity_type', 'staff')->where('entity_id', $staff->id)->pluck('project_id'));

        return $query->orderBy('name')->get()->map(function ($project) {
            $subconIds = DB::table('project_assign')
                ->where('entity_type', 'compsub')->where('project_id', $project->id)->pluck('entity_id')->unique();

            // inactive companies are inspected too (they may be inactive because of the very findings)
            $project->subcon_companies = SubconCompany::whereIn('id', $subconIds)
                ->orderBy('name')->select('id', 'name', 'status')->get();

            return $project;
        });
    }

    /**
     * One flow for the day on site: toolbox talk first (can be skipped),
     * then the inspections - or the toolbox talk only.
     */
    public function createVisit()
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();
        if (!$staff) {
            return redirect()->back()->with('error', 'Staff record not found');
        }

        // the company admin uses the same flow, on every project of the company
        $isAdmin = (int) $user->role_id === 2;
        $projects = $this->visitProjects($staff, $isAdmin, $user->company_id);

        return Inertia::render('Inspector/NewVisit', [
            'portal' => $isAdmin ? 'admin' : 'inspector',
            'endpoints' => $isAdmin
                ? ['store' => '/site-visits', 'done' => '/inspection', 'doneToolbox' => '/inspection']
                : ['store' => '/inspector/visits', 'done' => '/inspector/inspections', 'doneToolbox' => '/inspector/toolbox-talks'],
            'projects' => $projects,
            'categories' => \App\Models\InspectionCategory::catalogue(),
            'toolboxCategories' => \App\Models\ToolboxCategory::options(),
            'staffByProject' => \App\Support\ToolboxAttendees::byProject($projects->pluck('id'), $user->company_id),
            'evaluations' => Inspection::$evaluationOptions,
            'user' => $user,
        ]);
    }

    public function storeVisit(Request $request)
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->firstOrFail();

        $toolbox = $request->boolean('toolbox');
        $toolboxOnly = $toolbox && $request->boolean('toolbox_only');

        $rules = [
            'project_id' => 'required|exists:projects,id',
            'visit_date' => 'required|date',
            'toolbox' => 'required|boolean',
        ];
        $conducted = $request->boolean('conducted', true);
        if ($toolbox && $conducted) {
            $rules += [
                'attendees' => 'required|array|min:1',
                'attendees.*' => 'integer',
                'categories' => 'required|array|min:1',
                'categories.*' => 'integer|exists:toolbox_categories,id',
                'img_group' => 'nullable|image|max:2048',
                'img_attendance' => 'nullable|image|max:2048',
            ];
        } elseif ($toolbox) {
            // not conducted: attendance + Safety Passport sampling are still recorded
            $rules += [
                'attendees' => 'required|array|min:1',
                'attendees.*' => 'integer',
                'sp_not_registered' => 'nullable|integer|min:0|max:100000',
            ];
        }
        if (!$toolboxOnly) {
            $rules += [
                'inspections' => 'required|array|min:1',
                'inspections.*.subcon_company_id' => 'required|exists:subcon_company,id',
                'inspections.*.topic_id' => 'required|exists:toolbox_topic,id',
                'inspections.*.evaluation' => 'required|in:good,poor,nonconformance,clientcomplaint',
                'inspections.*.inspection_date' => 'required|date',
                'inspections.*.location' => 'required|string|max:255',
                'inspections.*.description' => 'required_unless:inspections.*.evaluation,good|string',
                'inspections.*.photos' => 'required_unless:inspections.*.evaluation,good|array',
                'inspections.*.photos.*' => 'image|max:2048',
            ];
        }
        $request->validate($rules, [
            'attendees.required' => 'Select at least one person for Safety Passport sampling.',
            'attendees.min' => 'Select at least one person for Safety Passport sampling.',
        ]);

        if ((int) $user->role_id === 2) {
            // company admin: any project of their own company
            abort_unless(
                Project::where('id', $request->project_id)->where('company_id', $user->company_id)->exists(),
                403,
                'This project does not belong to your company.'
            );
        } else {
            // the inspector may only work on the projects they are assigned to
            $isAssigned = ProjectAssign::where('entity_type', 'staff')
                ->where('entity_id', $staff->id)->where('project_id', $request->project_id)->exists();
            abort_unless($isAssigned, 403, 'You are not assigned to this project.');
        }

        $result = DB::transaction(function () use ($request, $user, $staff, $toolbox, $toolboxOnly, $conducted) {
            $talk = null;

            if ($toolbox) {
                $attendeeIds = !empty($request->attendees)
                    ? \App\Support\ToolboxAttendees::validIds((int) $request->project_id, $request->attendees, $user->company_id)
                    : [];

                if ($conducted && count($attendeeIds) === 0) {
                    throw \Illuminate\Validation\ValidationException::withMessages(['attendees' => 'Select at least one staff member who attended.']);
                }

                // Safety Passport sampling only for a talk that was NOT conducted
                $spSampled = null;
                $spNotRegistered = null;
                if (!$conducted && count($attendeeIds) > 0) {
                    $spSampled = count($attendeeIds);
                    $spNotRegistered = (int) ($request->sp_not_registered ?? 0);
                    if ($spNotRegistered > $spSampled) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'sp_not_registered' => "Cannot be more than the {$spSampled} worker(s) sampled.",
                        ]);
                    }
                }

                $spPlan = \App\Support\ToolboxSp::plan($attendeeIds, $request->input('sp'), $request->filled('sp_not_registered') ? (int) $request->input('sp_not_registered') : null);

                $talk = ToolboxTalks::create([
                    'project_id' => (int) $request->project_id,
                    'conducted' => $conducted ? 'yes' : 'no',
                    'inspection_by' => $staff->id,
                    'total_attended' => count($attendeeIds),
                    'sp_sampled' => $spSampled,
                    'sp_not_registered' => $spNotRegistered,
                    'inspection_date' => date('Y-m-d', strtotime($request->visit_date)),
                    'img_group' => ($conducted && $request->hasFile('img_group')) ? $request->file('img_group')->store('toolbox-talks/group', 'public') : null,
                    'img_attendance' => ($conducted && $request->hasFile('img_attendance')) ? $request->file('img_attendance')->store('toolbox-talks/attendance', 'public') : null,
                ]);
                if ($conducted) {
                    $talk->categories()->sync($request->categories);
                }
                if ($attendeeIds) {
                    \App\Support\ToolboxAttendees::sync($talk, $attendeeIds);
                }
                \App\Support\ToolboxSp::persist($talk, $spPlan);
            }

            $saved = 0;
            if (!$toolboxOnly) {
                foreach ($request->inspections as $index => $item) {
                    $paths = [];
                    foreach ($request->file("inspections.{$index}.photos", []) as $photo) {
                        $paths[] = $photo->store('inspections/photos', 'public');
                    }

                    $inspection = Inspection::create([
                        'project_id' => (int) $request->project_id,
                        'company_id' => $user->company_id,
                        'inspection_by' => $staff->id,
                        'toolbox_talk_id' => $talk?->id,
                        'topic_inspection_id' => $item['topic_id'],
                        'inspection_date' => $item['inspection_date'],
                        'location' => $item['location'],
                        'evaluation' => $item['evaluation'],
                        'description' => $item['description'] ?? null,
                        'subcon_company_id' => $item['subcon_company_id'],
                        'inspectee_id' => null,
                        'photo' => $this->encodePhotoPaths($paths),
                    ]);

                    // NC / CC cases are opened automatically, same as a stand-alone inspection
                    if ($item['evaluation'] === 'nonconformance') {
                        NoConformance::create(['inspection_id' => $inspection->id, 'status' => 'open', 'date_open' => $item['inspection_date']]);
                    }
                    if ($item['evaluation'] === 'clientcomplaint') {
                        ClientComplaint::create(['inspection_id' => $inspection->id, 'status' => 'open', 'date_open' => $item['inspection_date']]);
                    }
                    $saved++;
                }
            }

            return ['toolbox' => (bool) $talk, 'inspections' => $saved];
        });

        return response()->json(['success' => true] + $result);
    }

    public function getProjectSubconCompanies($projectId)
    {
        $subconCompanyIds = ProjectAssign::where('entity_type', 'subcon')
            ->where('project_id', $projectId)
            ->pluck('entity_id')
            ->unique();

        $subconCompanies = SubconCompany::whereIn('id', $subconCompanyIds)
            ->where('status', 'active')
            ->select('id', 'name', 'email', 'contact')
            ->get();

        return Inertia::location('Inspector/CreateInspection'); // Or return response
    }

    public function storeMultipleInspections(Request $request)
    {
        try {
            // Get the staff ID
            $staff = CompanyStaff::where('user_id', auth()->id())->first();

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff record not found'
                ], 404);
            }

            // Validate the request
            $request->validate([
                'inspections' => 'required|array|min:1',
                'inspections.*.project_id' => 'required|exists:projects,id',
                'inspections.*.subcon_company_id' => 'required|exists:subcon_company,id',
                'inspections.*.topic_id' => 'required|exists:toolbox_topic,id',
                'inspections.*.evaluation' => 'required|in:good,poor,nonconformance,clientcomplaint',
                'inspections.*.inspection_date' => 'required|date',
                'inspections.*.location' => 'required|string|max:255',
                'inspections.*.description' => 'required_unless:inspections.*.evaluation,good|string',
                'inspections.*.photos' => 'required_unless:inspections.*.evaluation,good|array',
                'inspections.*.photos.*' => 'image|max:2048',
            ]);

            $savedInspections = [];
            $validationErrors = [];

            foreach ($request->inspections as $index => $item) {
                try {
                    // Handle photos if any
                    $photoPaths = [];
                    if ($request->hasFile("inspections.{$index}.photos")) {
                        foreach ($request->file("inspections.{$index}.photos") as $photo) {
                            $path = $photo->store('inspections/photos', 'public');
                            $photoPaths[] = $path;
                        }
                    }

                    // Create inspection record
                    $inspection = Inspection::create([
                        'project_id' => $item['project_id'],
                        'company_id' => Auth::user()->company_id,
                        'inspection_by' => $staff->id,
                        'topic_inspection_id' => $item['topic_id'],
                        'inspection_date' => $item['inspection_date'],
                        'location' => $item['location'],
                        'evaluation' => $item['evaluation'],
                        'description' => $item['description'] ?? null,
                        'subcon_company_id' => $item['subcon_company_id'],
                        'inspectee_id' => null,
                        'photo' => $this->encodePhotoPaths($photoPaths),
                    ]);

                    // Auto-create nonconformance record
                    if ($item['evaluation'] === 'nonconformance') {
                        NoConformance::create([
                            'inspection_id' => $inspection->id,
                            'status' => 'open',
                            'date_open' => $item['inspection_date'],
                            'date_close' => null,
                            'review_by' => null,
                            'comment' => null,
                        ]);
                    }

                    // Auto-create client complaint record
                    if ($item['evaluation'] === 'clientcomplaint') {
                        ClientComplaint::create([
                            'inspection_id' => $inspection->id,
                            'status' => 'open',
                            'date_open' => $item['inspection_date'],
                            'date_close' => null,
                            'review_by' => null,
                            'comment' => null,
                        ]);
                    }

                    $savedInspections[] = $inspection->load(['project', 'subconCompany', 'topic', 'inspector']);
                } catch (\Exception $e) {
                    $validationErrors[] = [
                        'index' => $index,
                        'error' => $e->getMessage()
                    ];
                    Log::error("Error saving inspection at index {$index}: " . $e->getMessage());
                }
            }

            // Check if any inspections were saved
            if (count($savedInspections) === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save any inspections',
                    'errors' => $validationErrors
                ], 500);
            }

            $message = count($savedInspections) . ' inspection(s) created successfully';
            if (count($validationErrors) > 0) {
                $message .= ' but ' . count($validationErrors) . ' failed';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'inspections' => $savedInspections,
                'errors' => $validationErrors
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in storeMultipleInspections: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create inspections: ' . $e->getMessage()
            ], 500);
        }
    }

    public function showInspection($id)
{
    try {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        if (!$staff) {
            return redirect()->back()->with('error', 'Staff record not found');
        }

        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        // Load all relationships with snake_case names
        $inspection = Inspection::with([
            'project',
            'subconCompany',
            'topic',
            'inspector',
            'non_conformance',    // Changed from 'nonConformance'
            'client_complaint'    // Changed from 'clientComplaint'
        ])->whereIn('project_id', $assignedProjectIds)
          ->findOrFail($id);

        // Debug: Log the data to verify
        \Log::info('Inspection ID: ' . $inspection->id);
        \Log::info('Evaluation: ' . $inspection->evaluation);
        
        if ($inspection->non_conformance) {
            \Log::info('Non-conformance found:', $inspection->non_conformance->toArray());
        }
        if ($inspection->client_complaint) {
            \Log::info('Client complaint found:', $inspection->client_complaint->toArray());
        }

        return Inertia::render('Inspector/ShowInspection', [
            'inspection' => $inspection,
            'can_edit' => $this->canEdit($inspection),
            'user' => $user,
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Error showing inspection: ' . $e->getMessage());
        return redirect()->route('inspector.inspections')
            ->with('error', 'Inspection not found');
    }
}

    /**
     * Store new inspection
     */
    // public function storeInspection(Request $request)
    // {
    //     $user = Auth::user();
    //     $staff = CompanyStaff::where('user_id', $user->id)->first();

    //     $validated = $request->validate([
    //         'project_id' => 'required|exists:projects,id',
    //         'subcon_company_id' => 'nullable|exists:subcon_company,id',
    //         'topic_inspection_id' => 'nullable|exists:toolbox_topics,id',
    //         'evaluation' => 'required|in:good,poor,nonconformance,clientcomplaint',
    //         'description' => 'nullable|string',
    //         'inspection_date' => 'required|date',
    //         'location' => 'nullable|string|max:255',
    //         'inspectee_id' => 'nullable|exists:subcon_staff,id',
    //         'photos' => 'nullable|array',
    //         'photos.*' => 'image|max:2048',
    //     ]);

    //     $photoPaths = [];
    //     if ($request->hasFile('photos')) {
    //         foreach ($request->file('photos') as $photo) {
    //             $photoPaths[] = $photo->store('inspections', 'public');
    //         }
    //     }

    //     Inspection::create([
    //         'project_id' => $validated['project_id'],
    //         'company_id' => $staff->company_id,
    //         'inspection_by' => $staff->id,
    //         'topic_inspection_id' => $validated['topic_inspection_id'],
    //         'evaluation' => $validated['evaluation'],
    //         'description' => $validated['description'],
    //         'photo' => $photoPaths,
    //         'subcon_company_id' => $validated['subcon_company_id'],
    //         'inspectee_id' => $validated['inspectee_id'] ?? null,
    //         'inspection_date' => $validated['inspection_date'],
    //         'location' => $validated['location'],
    //     ]);

    //     return redirect()->route('inspector.inspections')->with('success', 'Inspection created successfully');
    // }

    /**
     * Show inspection details
     */
    // public function showInspection($id)
    // {
    //     $inspection = Inspection::with([
    //         'project',
    //         'subconCompany',
    //         'topic',
    //         'inspector',
    //     ])->findOrFail($id);

    //     $inspectee = null;
    //     if ($inspection->inspectee_id) {
    //         $inspectee = SubconStaff::find($inspection->inspectee_id);
    //     }

    //     return Inertia::render('Inspector/InspectionDetails', [
    //         'inspection' => $inspection,
    //         'inspectee' => $inspectee,
    //         'user' => Auth::user(),
    //     ]);
    // }

    /**
     * Show edit inspection form
     */
    public function editInspection($id)
    {
        $inspection = Inspection::findOrFail($id);
        $this->authorizeOwnEdit($inspection);

        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        $projects = Project::whereIn('id', $assignedProjectIds)->get()->map(function ($project) {
            $subconCompanyIds = ProjectAssign::where('entity_type', 'compsub')
                ->where('project_id', $project->id)
                ->pluck('entity_id')
                ->unique();

            $project->subcon_companies = SubconCompany::whereIn('id', $subconCompanyIds)
                ->orderBy('name')
                ->select('id', 'name', 'status')
                ->get();

            return $project;
        });
        $subconCompanies = SubconCompany::where('status', 'active')->get();
        $categories = \App\Models\InspectionCategory::catalogue();
        $evaluations = Inspection::$evaluationOptions;

        return Inertia::render('Inspector/EditInspection', [
            'inspection' => $inspection->load('topic:id,inspection_category_id,name'),
            'projects' => $projects,
            'subconCompanies' => $subconCompanies,
            'categories' => $categories,
            'evaluations' => $evaluations,
            'user' => Auth::user(),
        ]);
    }

    /**
     * Encode uploaded photo paths for the `photo` column.
     * The column is varchar(255) on older databases, so keep as many as fit.
     */
    private function encodePhotoPaths(array $paths): ?string
    {
        $paths = array_values($paths);
        while (count($paths) > 0) {
            $json = json_encode($paths);
            if (strlen($json) <= 255) {
                return $json;
            }
            array_pop($paths);
        }

        return null;
    }

    /**
     * Update inspection
     */
    public function updateInspection(Request $request, $id)
    {
        $inspection = Inspection::findOrFail($id);
        $this->authorizeOwnEdit($inspection);

        $existingPhotos = json_decode((string) $inspection->photo, true);
        $existingPhotos = is_array($existingPhotos) ? $existingPhotos : array_filter([$inspection->photo]);

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'subcon_company_id' => 'nullable|exists:subcon_company,id',
            'topic_inspection_id' => 'nullable|exists:toolbox_topic,id',
            'evaluation' => 'required|in:good,poor,nonconformance,clientcomplaint',
            'description' => 'required_unless:evaluation,good|string',
            'inspection_date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'inspectee_id' => 'nullable|exists:subcon_staff,id',
            'photos' => [\Illuminate\Validation\Rule::requiredIf(fn () => $request->input('evaluation') !== 'good' && count($existingPhotos) === 0), 'array'],
            'photos.*' => 'image|max:2048',
        ]);

        unset($validated['photos']);

        // Append any newly uploaded photos to the existing list
        if ($request->hasFile('photos')) {
            $existing = json_decode((string) $inspection->photo, true);
            $existing = is_array($existing) ? $existing : array_filter([$inspection->photo]);
            foreach ($request->file('photos') as $photo) {
                $existing[] = $photo->store('inspections/photos', 'public');
            }
            $validated['photo'] = $this->encodePhotoPaths(array_values($existing));
        }

        // a returned inspection goes back into the verification queue once corrected
        if ($inspection->status === Inspection::STATUS_REJECTED) {
            $validated['status'] = Inspection::STATUS_PENDING;
        }

        $inspection->update($validated);

        return redirect()->route('inspector.inspections')->with('success', 'Inspection updated successfully');
    }

    /**
     * Delete inspection
     */
    public function destroyInspection($id)
    {
        $inspection = Inspection::findOrFail($id);
        $this->authorizeOwnEdit($inspection);
        $inspection->delete();

        return redirect()->route('inspector.inspections')->with('success', 'Inspection deleted successfully');
    }

    // ==================== TOOLBOX TALK METHODS ====================

    /**
     * Show toolbox talks list page
     */
    public function toolboxTalks(Request $request)
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        if (!$staff) {
            return redirect()->back()->with('error', 'Staff record not found');
        }

        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        $query = ToolboxTalks::with(['project', 'CompanyStaff', 'categories:id,name', 'topics' => function ($query) {
            $query->select('toolbox_topic.id', 'toolbox_topic.name'); // legacy topics of old talks
        }])->whereIn('project_id', $assignedProjectIds);

        if ($request->project_id) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->start_date) {
            $query->whereDate('inspection_date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->whereDate('inspection_date', '<=', $request->end_date);
        }

        $toolboxTalks = $query->orderBy('inspection_date', 'desc')->paginate(6);

        // Debug: Log the first item's topics
        \Log::info('Toolbox Talks count: ' . $toolboxTalks->count());
        if ($toolboxTalks->count() > 0) {
            \Log::info('First talk topics: ', $toolboxTalks->first()->topics->toArray());
        }

        $projects = Project::whereIn('id', $assignedProjectIds)->select('id', 'name')->get();

        return Inertia::render('Inspector/ToolboxTalks', [
            'toolboxTalks' => $toolboxTalks,
            'projects' => $projects,
            'filters' => $request->only(['project_id', 'start_date', 'end_date']),
            'user' => $user,
        ]);
    }

    public function showToolboxTalkDetail($id)
    {
        try {
            $user = Auth::user();
            $staff = CompanyStaff::where('user_id', $user->id)->first();

            if (!$staff) {
                return redirect()->back()->with('error', 'Staff record not found');
            }

            $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
                ->where('entity_id', $staff->id)
                ->pluck('project_id');

            $toolboxTalk = ToolboxTalks::with(['project', 'companyStaff', 'topics', 'categories:id,name', 'attendees:id,name,role,company_id'])
                ->whereIn('project_id', $assignedProjectIds)
                ->findOrFail($id);

            return Inertia::render('Inspector/ShowToolboxTalk', [
                'toolboxTalk' => $toolboxTalk,
                'can_edit' => $this->canEdit($toolboxTalk),
                'user' => $user,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error showing toolbox talk: ' . $e->getMessage());
            return redirect()->route('inspector.toolbox-talks')
                ->with('error', 'Toolbox Talk not found');
        }
    }

    /**
     * Show create toolbox talk form
     */
    public function createToolboxTalk()
    {
        // Get the logged-in user
        $user = Auth::user();

        // Find the staff record for this user
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        if (!$staff) {
            return redirect()->back()->with('error', 'Staff record not found.');
        }




        // Get only projects that are assigned to this staff and are active
        $projects = ProjectAssign::where('entity_type', 'staff')
            ->with('project')
            ->where('entity_id', $staff->id)
            ->get();

        // dd($projects);

        // Get all topics for the form
        $topics = ToolboxTopic::all();

        // dd($topics);

        return inertia('Inspector/CreateToolboxTalk', [
            'projects' => $projects,
            'categories' => \App\Models\ToolboxCategory::options(),
            'staffByProject' => \App\Support\ToolboxAttendees::byProject($projects->pluck('project_id'), $user->company_id),
            'user' => $user,
        ]);
    }

    /**
     * Store new toolbox talk
     */
    public function storeToolboxTalk(Request $request)
    {
        try {
            \Log::info('=== STARTING TOOLBOX TALK CREATION ===');
            \Log::info('Request data:', $request->all());

            $user = Auth::user();
            $staff = CompanyStaff::where('user_id', $user->id)->firstOrFail();

            \Log::info('Staff found: ', ['id' => $staff->id, 'name' => $staff->name]);

            // Validate
            $rules = [
                'project_id' => 'required|exists:projects,id',
                'is_conducted' => 'required|boolean',
                'inspection_date' => 'required|date',
            ];

            // attendance + Safety Passport sampling are recorded even when the talk was not conducted
            $rules['attendees'] = 'required|array|min:1';
            $rules['attendees.*'] = 'integer';
            $rules['sp_not_registered'] = 'nullable|integer|min:0|max:100000';

            if ($request->is_conducted == 1) {
                $rules['conducted'] = 'nullable|string|max:255';
                $rules['attendees'] = 'required|array|min:1';
                $rules['categories'] = 'required|array|min:1';
                $rules['categories.*'] = 'integer|exists:toolbox_categories,id';
                $rules['img_group'] = 'nullable|image|max:2048';
                $rules['img_attendance'] = 'nullable|image|max:2048';
            }

            $validated = $request->validate($rules, [
                'attendees.required' => 'Select at least one person for Safety Passport sampling.',
                'attendees.min' => 'Select at least one person for Safety Passport sampling.',
            ]);

            \Log::info('Validation passed', $validated);

            // Convert inspection_date
            $inspectionDate = date('Y-m-d', strtotime($validated['inspection_date']));

            // Prepare data
            $conductedValue = $request->is_conducted == 1 ? 'yes' : 'no';
            // Attendance comes from the ticked subcontractor staff - nobody types a number
            $attendeeIds = !empty($validated['attendees'])
                ? \App\Support\ToolboxAttendees::validIds((int) $validated['project_id'], $validated['attendees'], $user->company_id)
                : [];

            if ($request->is_conducted == 1 && count($attendeeIds) === 0) {
                return redirect()->back()->withErrors(['attendees' => 'Select at least one staff member who attended.'])->withInput();
            }

            $totalAttended = count($attendeeIds);

            // Safety Passport sampling only for a talk that was NOT conducted;
            // workers sampled = the staff ticked as present.
            $spSampled = null;
            $spNotRegistered = null;
            if ($request->is_conducted != 1 && $totalAttended > 0) {
                $spSampled = $totalAttended;
                $spNotRegistered = (int) ($validated['sp_not_registered'] ?? 0);

                if ($spNotRegistered > $spSampled) {
                    return redirect()->back()
                        ->withErrors(['sp_not_registered' => "Cannot be more than the {$spSampled} worker(s) sampled."])
                        ->withInput();
                }
            }

            // Handle file uploads
            $imgGroupPath = null;
            $imgAttendancePath = null;

            if ($request->is_conducted == 1) {
                if ($request->hasFile('img_group')) {
                    $imgGroupPath = $request->file('img_group')->store('toolbox-talks/group', 'public');
                    \Log::info('Group photo saved: ' . $imgGroupPath);
                }
                if ($request->hasFile('img_attendance')) {
                    $imgAttendancePath = $request->file('img_attendance')->store('toolbox-talks/attendance', 'public');
                    \Log::info('Attendance photo saved: ' . $imgAttendancePath);
                }
            }

            // Create the record
            $insertData = [
                'project_id' => (int)$validated['project_id'],
                'conducted' => $conductedValue,
                'inspection_by' => $staff->id,
                'total_attended' => $totalAttended,
                'sp_sampled' => $spSampled,
                'sp_not_registered' => $spNotRegistered,
                'inspection_date' => $inspectionDate,
                'img_group' => $imgGroupPath,
                'img_attendance' => $imgAttendancePath,
            ];

            \Log::info('Attempting to insert:', $insertData);

            // Safety Passport sampling per subcontractor (validated before anything is saved)
            $spPlan = \App\Support\ToolboxSp::plan($attendeeIds, $request->input('sp'), $request->filled('sp_not_registered') ? (int) $request->input('sp_not_registered') : null);

            $toolboxTalk = ToolboxTalks::create($insertData);

            \Log::info('ToolboxTalk created with ID: ' . $toolboxTalk->id);

            // Attach the selected toolbox categories if conducted is YES
            if ($request->is_conducted == 1 && !empty($validated['categories'])) {
                $toolboxTalk->categories()->sync($validated['categories']);
            }

            if ($attendeeIds) {
                \App\Support\ToolboxAttendees::sync($toolboxTalk, $attendeeIds);
            }
            \App\Support\ToolboxSp::persist($toolboxTalk, $spPlan);

            \Log::info('=== TOOLBOX TALK CREATED SUCCESSFULLY ===');

            return redirect()->route('inspector.toolbox-talks')
                ->with('success', 'Toolbox Talk created successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed: ', $e->errors());
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            \Log::error('Error creating toolbox talk: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            return redirect()->back()
                ->with('error', 'Failed to create Toolbox Talk: ' . $e->getMessage())
                ->withInput();
        }
    }
    /**
     * Show toolbox talk details
     */
    public function showToolboxTalk($id)
    {
        return $this->showToolboxTalkDetail($id);
    }

    /**
     * Show edit toolbox talk form
     */
    public function editToolboxTalk($id)
    {
        $toolboxTalk = ToolboxTalks::with('topics')->findOrFail($id);
        $this->authorizeOwnEdit($toolboxTalk);

        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        $projects = Project::whereIn('id', $assignedProjectIds)->where('status', 'active')->get();
        $topics = ToolboxTopic::all();

        $toolboxTalk->load(['attendees:id', 'categories:id,name']);

        return Inertia::render('Inspector/EditToolboxTalk', [
            'toolboxTalk' => $toolboxTalk,
            'attendeeIds' => $toolboxTalk->attendees->pluck('id')->values(),
            'spByCompany' => (object) \App\Support\ToolboxSp::forTalk($toolboxTalk->id),
            'projects' => $projects,
            'categories' => \App\Models\ToolboxCategory::options(),
            'staffByProject' => \App\Support\ToolboxAttendees::byProject($projects->pluck('id'), Auth::user()->company_id),
            'user' => Auth::user(),
        ]);
    }

    /**
     * Update toolbox talk
     */
    public function updateToolboxTalk(Request $request, $id)
    {
        $toolboxTalk = ToolboxTalks::findOrFail($id);
        $this->authorizeOwnEdit($toolboxTalk);

        $conducted = (int) $request->input('is_conducted', 1) === 1;

        $rules = [
            'project_id' => 'required|exists:projects,id',
            'inspection_date' => 'required|date',
            'attendees' => 'required|array|min:1',
            'attendees.*' => 'integer',
            'sp_not_registered' => 'nullable|integer|min:0|max:100000',
        ];

        if ($conducted) {
            $rules['attendees'] = 'required|array|min:1';
            $rules['categories'] = 'required|array|min:1';
            $rules['categories.*'] = 'integer|exists:toolbox_categories,id';
            $rules['img_group'] = 'nullable|image|max:2048';
            $rules['img_attendance'] = 'nullable|image|max:2048';
        }

        $validated = $request->validate($rules, [
            'attendees.required' => 'Select at least one person for Safety Passport sampling.',
            'attendees.min' => 'Select at least one person for Safety Passport sampling.',
        ]);

        $attendeeIds = !empty($validated['attendees'])
            ? \App\Support\ToolboxAttendees::validIds((int) $validated['project_id'], $validated['attendees'], Auth::user()->company_id)
            : [];

        if ($conducted && count($attendeeIds) === 0) {
            return back()->withErrors(['attendees' => 'Select at least one staff member who attended.']);
        }

        // Safety Passport sampling only for a talk that was NOT conducted
        $spSampled = null;
        $spNotRegistered = null;
        if (!$conducted && count($attendeeIds) > 0) {
            $spSampled = count($attendeeIds);
            $spNotRegistered = (int) ($validated['sp_not_registered'] ?? 0);

            if ($spNotRegistered > $spSampled) {
                return back()->withErrors(['sp_not_registered' => "Cannot be more than the {$spSampled} worker(s) sampled."]);
            }
        }

        $data = [
            'project_id' => $validated['project_id'],
            'inspection_date' => date('Y-m-d', strtotime($validated['inspection_date'])),
            'conducted' => $conducted ? 'yes' : 'no',
            'total_attended' => count($attendeeIds),
            'sp_sampled' => $spSampled,
            'sp_not_registered' => $spNotRegistered,
        ];

        if ($conducted) {
            if ($request->hasFile('img_group')) {
                $data['img_group'] = $request->file('img_group')->store('toolbox-talks/group', 'public');
            }
            if ($request->hasFile('img_attendance')) {
                $data['img_attendance'] = $request->file('img_attendance')->store('toolbox-talks/attendance', 'public');
            }
        }

        // a returned talk goes back into the verification queue once corrected
        if ($toolboxTalk->status === 'rejected') {
            $data['status'] = 'pending_verification';
        }

        $spPlan = \App\Support\ToolboxSp::plan($attendeeIds, $request->input('sp'), $request->filled('sp_not_registered') ? (int) $request->input('sp_not_registered') : null);

        $toolboxTalk->update($data);
        $toolboxTalk->categories()->sync($conducted ? $validated['categories'] : []);
        \App\Support\ToolboxAttendees::sync($toolboxTalk, $attendeeIds);
        \App\Support\ToolboxSp::persist($toolboxTalk, $spPlan);

        return redirect()->route('inspector.toolbox-talks')->with('success', 'Toolbox Talk updated successfully');
    }

    /**
     * Delete toolbox talk
     */
    public function destroyToolboxTalk($id)
    {
        $toolboxTalk = ToolboxTalks::findOrFail($id);
        $this->authorizeOwnEdit($toolboxTalk);
        $toolboxTalk->topics()->detach();
        $toolboxTalk->delete();

        return redirect()->route('inspector.toolbox-talks')->with('success', 'Toolbox Talk deleted successfully');
    }

    // ==================== PROJECT METHODS ====================

    /**
     * Get projects list
     */
    /** Site visits on the inspector's projects: toolbox talk + inspections together, with review status. */
    public function visits()
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        // every visit on the projects the inspector is assigned to; only their own can be edited
        return Inertia::render('Inspector/Visits', [
            'visits' => $staff ? \App\Support\VisitFeed::collect($user->company_id, $this->assignedProjectIds($staff)) : [],
            'me' => $staff?->id,
            'user' => $user,
        ]);
    }

    /**
     * An inspector may change only their own inspections / toolbox talks, and only
     * while they are still waiting for verification or were returned to them.
     */
    private function authorizeOwnEdit($record): void
    {
        $staff = CompanyStaff::where('user_id', Auth::id())->first();
        abort_unless($staff && (int) $record->inspection_by === (int) $staff->id, 403, 'You can only edit your own records.');
        abort_unless($this->stillEditable($record), 403, 'This record is already verified or approved and can no longer be changed.');
    }

    private function stillEditable($record): bool
    {
        return in_array($record->status ?: Inspection::STATUS_PENDING, [Inspection::STATUS_PENDING, Inspection::STATUS_REJECTED], true);
    }

    private function canEdit($record): bool
    {
        $staffId = CompanyStaff::where('user_id', Auth::id())->value('id');

        return $staffId && (int) $record->inspection_by === (int) $staffId && $this->stillEditable($record);
    }

    /** A site visit on one of the inspector's projects: toolbox talk, inspections and review progress. */
    public function showVisit(string $key)
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();
        abort_unless($staff, 404);

        $visit = \App\Support\VisitFeed::collect($user->company_id, $this->assignedProjectIds($staff))->firstWhere('key', $key);
        abort_unless($visit, 404);

        return Inertia::render('Inspector/VisitShow', [
            'visit' => $visit,
            'me' => $staff->id,
            'user' => $user,
        ]);
    }

    private function assignedProjectIds(CompanyStaff $staff)
    {
        return ProjectAssign::where('entity_type', 'staff')->where('entity_id', $staff->id)->pluck('project_id');
    }

    /**
     * Daily attendance ticked by the subcontractor leaders - read only for inspectors.
     */
    public function attendance(Request $request)
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();
        $date = $request->query('date', now()->toDateString());

        $assigned = $staff
            ? ProjectAssign::where('entity_type', 'staff')->where('entity_id', $staff->id)->pluck('project_id')
            : collect();

        $projects = Project::where('company_id', $user->company_id)
            ->when($assigned->isNotEmpty(), fn ($q) => $q->whereIn('id', $assigned))
            ->orderBy('name')
            ->get(['id', 'name']);

        $rows = \Illuminate\Support\Facades\DB::table('manhour_attendances as a')
            ->join('subcon_staff as st', 'st.id', '=', 'a.subcon_staff_id')
            ->join('subcon_company as c', 'c.id', '=', 'a.subcon_company_id')
            ->whereIn('a.project_id', $projects->pluck('id'))
            ->where('a.work_date', $date)
            ->orderBy('c.name')->orderBy('st.name')
            ->get(['a.project_id', 'a.subcon_company_id', 'c.name as subcon', 'st.id as staff_id', 'st.name as staff', 'st.role', 'a.hours']);

        $groups = $projects->map(fn ($p) => [
            'project_id' => $p->id,
            'project' => $p->name,
            'subcons' => $rows->where('project_id', $p->id)->groupBy('subcon_company_id')->map(fn ($g) => [
                'name' => $g->first()->subcon,
                'workers' => $g->count(),
                'manhours' => (float) $g->sum('hours'),
                'staff' => $g->map(fn ($r) => ['id' => $r->staff_id, 'name' => $r->staff, 'role' => $r->role])->values(),
            ])->values(),
        ])->values();

        return Inertia::render('Inspector/Attendance', [
            'date' => $date,
            'groups' => $groups,
            'user' => $user,
        ]);
    }

    public function projects(Request $request)
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        if (!$staff) {
            return redirect()->back()->with('error', 'Staff record not found');
        }

        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        $query = Project::whereIn('id', $assignedProjectIds)
            ->withCount(['inspections', 'toolboxTalks'])
            ->withCount([
                'inspections as open_issue_count' => fn ($q) => $q->whereIn('evaluation', ['nonconformance', 'clientcomplaint']),
            ]);

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $myRoles = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('role_assignment', 'project_id');

        $statusCounts = Project::whereIn('id', $assignedProjectIds)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $projects = $query->orderBy('created_at', 'desc')->paginate(15);
        $projects->getCollection()->transform(function ($project) use ($myRoles) {
            $project->my_role = $myRoles[$project->id] ?? null;
            return $project;
        });

        return Inertia::render('Inspector/Projects', [
            'projects' => $projects,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['search', 'status']),
            'user' => $user,
        ]);
    }

    /**
     * Show project details
     */
    public function showProject($id)
    {
        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        // Only projects assigned to this inspector
        $isAssigned = $staff && ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->where('project_id', $id)
            ->exists();

        if (!$isAssigned) {
            return redirect()->route('inspector.projects')->with('error', 'Project not found');
        }

        $project = Project::findOrFail($id);
        // raw rows: the ProjectAssign model rewrites entity_type to class names
        $assigns = DB::table('project_assign')->where('project_id', $id)->get();

        // Main company team (inspectors / site staff)
        $staffAssign = $assigns->where('entity_type', 'staff');
        $team = CompanyStaff::whereIn('id', $staffAssign->pluck('entity_id'))->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'contact' => $m->contact,
                'role' => optional($staffAssign->firstWhere('entity_id', $m->id))->role_assignment,
                'is_me' => $m->id === $staff->id,
            ])->values();

        // Subcontractor companies assigned to the project
        $compAssign = $assigns->where('entity_type', 'compsub');
        $subStaffAssign = $assigns->where('entity_type', 'subcon');
        $subStaffAll = SubconStaff::whereIn('id', $subStaffAssign->pluck('entity_id'))->get();

        $inspectionCounts = Inspection::where('project_id', $id)
            ->select('subcon_company_id', DB::raw('count(*) as total'))
            ->groupBy('subcon_company_id')
            ->pluck('total', 'subcon_company_id');

        $subcons = SubconCompany::whereIn('id', $compAssign->pluck('entity_id'))->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'contact' => $c->contact,
                'status' => $c->status,
                'scope' => optional($compAssign->firstWhere('entity_id', $c->id))->role_assignment,
                'inspections' => (int) ($inspectionCounts[$c->id] ?? 0),
                'staff' => $subStaffAll->where('company_id', $c->id)->map(fn ($st) => [
                    'id' => $st->id,
                    'name' => $st->name,
                    'role' => optional($subStaffAssign->firstWhere('entity_id', $st->id))->role_assignment ?: $st->role,
                    'contact' => $st->contact,
                ])->values(),
            ])->values();

        $inspections = Inspection::with(['subconCompany', 'topic'])
            ->where('project_id', $id)
            ->orderBy('inspection_date', 'desc')
            ->get();

        $evaluation = [];
        foreach (['good', 'poor', 'nonconformance', 'clientcomplaint'] as $ev) {
            $evaluation[$ev] = $inspections->where('evaluation', $ev)->count();
        }

        $recentInspections = $inspections->take(8)->map(fn ($i) => [
            'id' => $i->id,
            'subcon_name' => $i->subconCompany->name ?? 'Main Company',
            'topic' => $i->topic->name ?? 'N/A',
            'evaluation' => $i->evaluation,
            'inspection_date' => $i->inspection_date ? $i->inspection_date->format('Y-m-d') : null,
            'location' => $i->location,
        ])->values();

        $talks = ToolboxTalks::with('CompanyStaff')
            ->where('project_id', $id)
            ->orderBy('inspection_date', 'desc')
            ->get();

        $recentTalks = $talks->take(5)->map(fn ($t) => [
            'id' => $t->id,
            'conducted' => $t->conducted,
            'total_attended' => $t->total_attended,
            'conducted_by' => $t->CompanyStaff->name ?? null,
            'inspection_date' => $t->inspection_date ? $t->inspection_date->format('Y-m-d') : null,
        ])->values();

        return Inertia::render('Inspector/ProjectDetails', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'location' => $project->location,
                'status' => $project->status,
                'start_date' => $project->start_date,
                'end_date' => $project->end_date,
            ],
            'myRole' => optional($staffAssign->firstWhere('entity_id', $staff->id))->role_assignment,
            'stats' => [
                'total_inspections' => $inspections->count(),
                'open_issues' => $evaluation['nonconformance'] + $evaluation['clientcomplaint'],
                'toolbox_talks' => $talks->count(),
                'conducted_talks' => $talks->where('conducted', 'yes')->count(),
                'team' => $team->count(),
                'subcons' => $subcons->count(),
            ],
            'evaluation' => $evaluation,
            'team' => $team,
            'subcons' => $subcons,
            'recentInspections' => $recentInspections,
            'recentTalks' => $recentTalks,
            'user' => $user,
        ]);
    }

    // ==================== SUB CONTRACTOR METHODS ====================

    /**
     * Get subcon companies list
     */
    public function subconCompanies(Request $request)
    {
        $query = SubconCompany::withCount('subconStaff')
            ->when(Auth::user()->company_id, fn ($q, $companyId) => $q->where('company_id', $companyId));

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $companies = $query->orderBy('name')->paginate(15);

        return Inertia::render('Inspector/SubconCompanies', [
            'companies' => $companies,
            'filters' => $request->only(['search', 'status']),
            'user' => Auth::user(),
        ]);
    }

    /**
     * Show subcon company details
     */
    public function showSubconCompany($id)
    {
        $company = \App\Support\SubconDetail::find($id, Auth::user()->company_id);
        $detail = \App\Support\SubconDetail::for($company);
        $company->load(['projects', 'assignments']);

        $inspections = Inspection::with(['project', 'topic'])
            ->where('subcon_company_id', $id)
            ->orderBy('inspection_date', 'desc')
            ->limit(10)
            ->get();

        $stats = [
            'total_staff' => $company->subconStaff->count(),
            'active_projects' => $company->projects->where('status', 'active')->count(),
            'total_inspections' => Inspection::where('subcon_company_id', $id)->count(),
            'nonconformance_count' => Inspection::where('subcon_company_id', $id)
                ->where('evaluation', 'nonconformance')->count(),
        ];

        return Inertia::render('Inspector/SubconCompanyDetails', [
            'company' => $company,
            'inspections' => $inspections,
            'stats' => $stats,
            'user' => Auth::user(),
        ] + $detail);
    }
}
