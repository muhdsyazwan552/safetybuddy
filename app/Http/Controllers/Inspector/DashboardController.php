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

        return Inertia::render('Inspector/Dashboard', [
            'stats' => $stats,
            'recentInspections' => $recentInspections,
            'projects' => $projects,
            'evaluationStats' => $evaluationStats,
            'recentToolboxTalks' => $recentToolboxTalks,
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
                ->where('status', 'active')
                ->select('id', 'name', 'email', 'contact')
                ->get();

            // Add subcon companies to project object
            $project->subcon_companies = $subconCompanies;

            return $project;
        });

        $topics = ToolboxTopic::all();
        $evaluations = Inspection::$evaluationOptions;

        return Inertia::render('Inspector/CreateInspection', [
            'projects' => $projects,
            'topics' => $topics,
            'evaluations' => $evaluations,
            'user' => $user,
            'staffId' => $staff->id,
        ]);
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
                'inspections.*.evaluation' => 'required|in:good,moderate,poor,nonconformance,clientcomplaint',
                'inspections.*.inspection_date' => 'required|date',
                'inspections.*.location' => 'required|string|max:255',
                'inspections.*.description' => 'nullable|string',
                'inspections.*.photos' => 'nullable|array',
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
                        'photos' => json_encode($photoPaths),
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
    //         'evaluation' => 'required|in:good,moderate,poor,nonconformance,clientcomplaint',
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

        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        $projects = Project::whereIn('id', $assignedProjectIds)->where('status', 'active')->get();
        $subconCompanies = SubconCompany::where('status', 'active')->get();
        $topics = ToolboxTopic::all();
        $evaluations = Inspection::$evaluationOptions;

        return Inertia::render('Inspector/EditInspection', [
            'inspection' => $inspection,
            'projects' => $projects,
            'subconCompanies' => $subconCompanies,
            'topics' => $topics,
            'evaluations' => $evaluations,
            'user' => Auth::user(),
        ]);
    }

    /**
     * Update inspection
     */
    public function updateInspection(Request $request, $id)
    {
        $inspection = Inspection::findOrFail($id);

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'subcon_company_id' => 'nullable|exists:subcon_company,id',
            'topic_inspection_id' => 'nullable|exists:toolbox_topics,id',
            'evaluation' => 'required|in:good,moderate,poor,nonconformance,clientcomplaint',
            'description' => 'nullable|string',
            'inspection_date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'inspectee_id' => 'nullable|exists:subcon_staff,id',
        ]);

        $inspection->update($validated);

        return redirect()->route('inspector.inspections')->with('success', 'Inspection updated successfully');
    }

    /**
     * Delete inspection
     */
    public function destroyInspection($id)
    {
        $inspection = Inspection::findOrFail($id);
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

        $query = ToolboxTalks::with(['project', 'CompanyStaff', 'topics' => function ($query) {
            $query->select('toolbox_topic.id', 'toolbox_topic.name'); // Explicitly select fields
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

            $toolboxTalk = ToolboxTalks::with(['project', 'companyStaff', 'topics'])
                ->whereIn('project_id', $assignedProjectIds)
                ->findOrFail($id);

            return Inertia::render('Inspector/ShowToolboxTalk', [
                'toolboxTalk' => $toolboxTalk,
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
            'topics' => $topics,
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

            if ($request->is_conducted == 1) {
                $rules['conducted'] = 'nullable|string|max:255';
                $rules['total_attended'] = 'required|integer|min:1';
                $rules['topics'] = 'required|array|min:1';
                $rules['topics.*'] = 'exists:toolbox_topic,id'; // Fixed table name
                $rules['img_group'] = 'nullable|image|max:2048';
                $rules['img_attendance'] = 'nullable|image|max:2048';
            }

            $validated = $request->validate($rules);

            \Log::info('Validation passed', $validated);

            // Convert inspection_date
            $inspectionDate = date('Y-m-d', strtotime($validated['inspection_date']));

            // Prepare data
            $conductedValue = $request->is_conducted == 1 ? 'yes' : 'no';
            $totalAttended = $request->is_conducted == 1 ? (int)$validated['total_attended'] : 0;

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
                'inspection_date' => $inspectionDate,
                'img_group' => $imgGroupPath,
                'img_attendance' => $imgAttendancePath,
            ];

            \Log::info('Attempting to insert:', $insertData);

            $toolboxTalk = ToolboxTalks::create($insertData);

            \Log::info('ToolboxTalk created with ID: ' . $toolboxTalk->id);

            // Attach topics if conducted is YES
            if ($request->is_conducted == 1 && !empty($validated['topics'])) {
                $topicsToAttach = $validated['topics'];
                \Log::info('Topics to attach (IDs):', $topicsToAttach);

                // Method 1: Using attach
                $toolboxTalk->topics()->attach($topicsToAttach);

                // Method 2: Alternative manual insertion (use if Method 1 doesn't work)
                // foreach ($topicsToAttach as $topicId) {
                //     \DB::table('toolbox_talks_topics')->insert([
                //         'toolbox_talks_id' => $toolboxTalk->id,
                //         'toolbox_topic_id' => $topicId,
                //     ]);
                // }

                \Log::info('Topics attached successfully');

                // Verify attachment
                $attachedCount = $toolboxTalk->topics()->count();
                \Log::info('Total topics attached: ' . $attachedCount);
            }

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
        $toolboxTalk = ToolboxTalks::with(['project', 'CompanyStaff', 'topics'])->findOrFail($id);

        return Inertia::render('Inspector/ToolboxTalkDetails', [
            'toolboxTalk' => $toolboxTalk,
            'user' => Auth::user(),
        ]);
    }

    /**
     * Show edit toolbox talk form
     */
    public function editToolboxTalk($id)
    {
        $toolboxTalk = ToolboxTalks::with('topics')->findOrFail($id);

        $user = Auth::user();
        $staff = CompanyStaff::where('user_id', $user->id)->first();

        $assignedProjectIds = ProjectAssign::where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->pluck('project_id');

        $projects = Project::whereIn('id', $assignedProjectIds)->where('status', 'active')->get();
        $topics = ToolboxTopic::all();

        return Inertia::render('Inspector/EditToolboxTalk', [
            'toolboxTalk' => $toolboxTalk,
            'projects' => $projects,
            'topics' => $topics,
            'user' => Auth::user(),
        ]);
    }

    /**
     * Update toolbox talk
     */
    public function updateToolboxTalk(Request $request, $id)
    {
        $toolboxTalk = ToolboxTalks::findOrFail($id);

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'conducted' => 'nullable|string|max:255',
            'total_attended' => 'required|integer|min:1',
            'topics' => 'required|array|min:1',
            'topics.*' => 'exists:toolbox_topics,id',
            'inspection_date' => 'required|date',
            'img_group' => 'nullable|image|max:2048',
            'img_attendance' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('img_group')) {
            $validated['img_group'] = $request->file('img_group')->store('toolbox-talks/group', 'public');
        }

        if ($request->hasFile('img_attendance')) {
            $validated['img_attendance'] = $request->file('img_attendance')->store('toolbox-talks/attendance', 'public');
        }

        $toolboxTalk->update($validated);
        $toolboxTalk->topics()->sync($validated['topics']);

        return redirect()->route('inspector.toolbox-talks')->with('success', 'Toolbox Talk updated successfully');
    }

    /**
     * Delete toolbox talk
     */
    public function destroyToolboxTalk($id)
    {
        $toolboxTalk = ToolboxTalks::findOrFail($id);
        $toolboxTalk->topics()->detach();
        $toolboxTalk->delete();

        return redirect()->route('inspector.toolbox-talks')->with('success', 'Toolbox Talk deleted successfully');
    }

    // ==================== PROJECT METHODS ====================

    /**
     * Get projects list
     */
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

        $query = Project::whereIn('id', $assignedProjectIds)->withCount('inspections');

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $projects = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Inspector/Projects', [
            'projects' => $projects,
            'filters' => $request->only(['search', 'status']),
            'user' => $user,
        ]);
    }

    /**
     * Show project details
     */
    public function showProject($id)
    {
        $project = Project::with([
            'assignedStaff',
            'assignedSubconStaff',
            'inspections' => function ($q) {
                $q->orderBy('inspection_date', 'desc');
            },
            'inspections.subconCompany',
            'inspections.topic',
            'toolboxTalks',
            'toolboxTalks.topics',
            'toolboxTalks.CompanyStaff',
        ])->findOrFail($id);

        $stats = [
            'total_inspections' => $project->inspections->count(),
            'nonconformance_count' => $project->inspections->where('evaluation', 'nonconformance')->count(),
            'complaint_count' => $project->inspections->where('evaluation', 'clientcomplaint')->count(),
            'good_count' => $project->inspections->where('evaluation', 'good')->count(),
            'moderate_count' => $project->inspections->where('evaluation', 'moderate')->count(),
            'poor_count' => $project->inspections->where('evaluation', 'poor')->count(),
            'toolbox_talks_count' => $project->toolboxTalks->count(),
        ];

        return Inertia::render('Inspector/ProjectDetails', [
            'project' => $project,
            'stats' => $stats,
            'user' => Auth::user(),
        ]);
    }

    // ==================== SUB CONTRACTOR METHODS ====================

    /**
     * Get subcon companies list
     */
    public function subconCompanies(Request $request)
    {
        $query = SubconCompany::withCount('subconStaff');

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
        $company = SubconCompany::with([
            'subconStaff',
            'projects',
            'assignments'
        ])->findOrFail($id);

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
        ]);
    }
}
