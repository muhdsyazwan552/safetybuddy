<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\Company;
use App\Models\CompanyStaff;
use App\Models\Project;
use App\Models\SubconCompany;
use App\Models\ToolboxTopic;
use App\Models\ToolboxTalks;
use App\Models\User;
use App\Models\NoConformance;
use App\Models\ClientComplaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class InspectionController extends Controller
{
    public function dashboard(Request $request)
    {

        $companyId = Auth::user()->company_id;

        $selectedProjectId = $request->get('project_id');

        logger('Selected Project ID:', ['project_id' => $selectedProjectId]);


        // Everything on this dashboard is scoped to the logged-in company.
        $companyProjects = Project::where('company_id', $companyId);
        $projectIds = (clone $companyProjects)->pluck('id');

        $thisMonth = now()->startOfMonth();
        $lastMonth = now()->subMonthNoOverflow()->startOfMonth();

        // [total, active, created/recorded this month, same for last month]
        $makeCard = function ($total, $active, $thisCount, $lastCount) {
            return [
                'total' => (int) $total,
                'active' => (int) $active,
                'this_month' => (int) $thisCount,
                'last_month' => (int) $lastCount,
            ];
        };

        $projectsAll = Project::where('company_id', $companyId);
        $cards = [
            'projects' => $makeCard(
                (clone $projectsAll)->count(),
                (clone $projectsAll)->whereIn('status', ['active', 'in_progress'])->count(),
                (clone $projectsAll)->where('created_at', '>=', $thisMonth)->count(),
                (clone $projectsAll)->whereBetween('created_at', [$lastMonth, $thisMonth])->count()
            ),
            // company staff (inspectors, site staff, managers) - not just users with role 4
            'employees' => $makeCard(
                CompanyStaff::where('company_id', $companyId)->count(),
                CompanyStaff::where('company_id', $companyId)->where('status', 'active')->count(),
                CompanyStaff::where('company_id', $companyId)->where('created_at', '>=', $thisMonth)->count(),
                CompanyStaff::where('company_id', $companyId)->whereBetween('created_at', [$lastMonth, $thisMonth])->count()
            ),
            // executors = subcontractor companies registered under this company
            'executors' => $makeCard(
                SubconCompany::where('company_id', $companyId)->count(),
                SubconCompany::where('company_id', $companyId)->where('status', 'active')->count(),
                SubconCompany::where('company_id', $companyId)->where('created_at', '>=', $thisMonth)->count(),
                SubconCompany::where('company_id', $companyId)->whereBetween('created_at', [$lastMonth, $thisMonth])->count()
            ),
            'inspections' => $makeCard(
                Inspection::whereIn('project_id', $projectIds)->count(),
                Inspection::whereIn('project_id', $projectIds)->whereIn('evaluation', ['nonconformance', 'clientcomplaint'])->count(),
                Inspection::whereIn('project_id', $projectIds)->where('inspection_date', '>=', $thisMonth)->count(),
                Inspection::whereIn('project_id', $projectIds)->whereBetween('inspection_date', [$lastMonth, $thisMonth])->count()
            ),
        ];

        $userProjectCount = $cards['projects']['total'];
        $userEmployeeCount = $cards['employees']['total'];
        $userExecutorCount = $cards['executors']['total'];
        $userInspectionCount = $cards['inspections']['total'];

        $inspections = Inspection::with(['project', 'company', 'topic', 'inspector', 'subconCompany'])
            ->whereIn('project_id', $projectIds)
            ->latest();

        // If a project is selected, only load inspections for that project
        if ($selectedProjectId) {
            $inspections->where('project_id', $selectedProjectId);
        }

        $inspections = $inspections->get();

        $projects = Project::where('company_id', $companyId)->get();
        if ($selectedProjectId) {
            $all_companies = SubconCompany::where('company_id', $companyId)
                ->whereHas('inspections', function ($q) use ($selectedProjectId) {
                    $q->where('project_id', $selectedProjectId);
                })->get();
        } else {
            $all_companies = SubconCompany::where('company_id', $companyId)->get();
        }
        $topics = ToolboxTopic::all();

        // Generate chart data
        $executorChartData = $this->getInspectionsByExecutorData($inspections, $all_companies, $selectedProjectId);
        $projectChartData = $this->getInspectionsByProjectData($inspections, $projects);
        $findingsSummary = $this->getFindingsSummary($inspections, $projects);
        $topicChartData = $this->getInspectionsByTopicData($inspections, ToolboxTopic::all());

        return Inertia::render('WSIS/Dashboard_Inspection', [
            'title' => 'Inspections Management',
            'inspections' => $inspections,
            'projects' => $projects,
            'all_companies' => $all_companies,
            'topics' => $topics,
            'inspection_categories' => \App\Models\InspectionCategory::orderBy('sort_order')->get(['id', 'code', 'name']),
            'executor_chart_data' => $executorChartData, // Add this
            'project_chart_data' => $projectChartData,
            'findings_summary' => $findingsSummary,
            'topic_chart_data' => $topicChartData,
            'user_project_count' => $userProjectCount,
            'user_employee_count' => $userEmployeeCount,
            'user_executor_count' => $userExecutorCount,
            'user_inspection_count' => $userInspectionCount,
            'dashboard_cards' => $cards,
        ]);
    }

    private function getInspectionsByExecutorData($inspections, $all_companies, $selectedProjectId = null)
    {
        $data = [];

        // ✅ Group by subcon_company_id not company_id
        $inspectionsBySubcon = $inspections->groupBy('subcon_company_id');

        foreach ($all_companies as $company) {
            $companyInspections = $inspectionsBySubcon->get($company->id, collect());

            if ($selectedProjectId) {
                $companyInspections = $companyInspections->where('project_id', $selectedProjectId);
            }

            $data[] = [
                'name'            => $company->name,
                'short_name'      => $company->short_name ?? $company->name,
                'count'           => $companyInspections->count(),
                'good'            => $companyInspections->where('evaluation', 'good')->count(),
                'poor'            => $companyInspections->where('evaluation', 'poor')->count(),
                'nonconformance'  => $companyInspections->where('evaluation', 'nonconformance')->count(),
                'clientcomplaint' => $companyInspections->where('evaluation', 'clientcomplaint')->count(),
                'company_id'      => $company->id, // this is now the subcon company id
                'project_ids'     => $companyInspections->pluck('project_id')->unique()->values(),
            ];
        }

        return $data;
    }

    private function getInspectionsByProjectData($inspections, $projects)
    {
        $data = [];

        foreach ($projects as $project) {
            $projectInspections = $inspections->where('project_id', $project->id);
            $inspectionCount = $projectInspections->count();

            // Count evaluations by type (including zeros)
            $evaluations = [
                'good' => $projectInspections->where('evaluation', 'good')->count(),
                'poor' => $projectInspections->where('evaluation', 'poor')->count(),
                'nonconformance' => $projectInspections->where('evaluation', 'nonconformance')->count(),
                'clientcomplaint' => $projectInspections->where('evaluation', 'clientcomplaint')->count(),
            ];

            $data[] = [
                'name' => $project->name,
                'count' => $inspectionCount,
                'project_id' => $project->id,
                'evaluations' => $evaluations,
            ];
        }

        return $data;
    }

    private function getFindingsSummary($inspections, $projects)
    {
        $evaluations = ['good', 'poor', 'nonconformance', 'clientcomplaint'];
        $result = [];

        // "all" — no percent, just count per evaluation across all inspections
        $allSummary = [];
        foreach ($evaluations as $ev) {
            $filtered = $inspections->where('evaluation', $ev);
            $allSummary[$ev] = [
                'topics' => $filtered->pluck('topic.name')->filter()->unique()->values(),
                'count'  => $filtered->count(),
            ];
        }
        $result['all'] = ['summary' => $allSummary];

        // Per project — count per evaluation only within that project
        foreach ($projects as $project) {
            $projectInspections = $inspections->where('project_id', $project->id);
            $projectSummary = [];

            foreach ($evaluations as $ev) {
                $filtered = $projectInspections->where('evaluation', $ev);
                $projectSummary[$ev] = [
                    'topics' => $filtered->pluck('topic.name')->filter()->unique()->values(),
                    'count'  => $filtered->count(), // total per evaluation in this project only
                ];
            }

            $result[$project->id] = [
                'summary'      => $projectSummary,
                'total'        => $projectInspections->count(), // total inspections in this project
                'project_name' => $project->name,
            ];
        }

        return $result;
    }

    private function getInspectionsByTopicData($inspections, $topics)
    {
        $data = [];

        foreach ($topics as $topic) {
            $topicInspections = $inspections->where('topic_id', $topic->id);

            $data[] = [
                'name' => $topic->name,
                'total' => $topicInspections->count(),
                'good' => $topicInspections->where('evaluation', 'good')->count(),
                'poor' => $topicInspections->where('evaluation', 'poor')->count(),
                'nonconformance' => $topicInspections->where('evaluation', 'nonconformance')->count(),
                'clientcomplaint' => $topicInspections->where('evaluation', 'clientcomplaint')->count(),
                'topic_id' => $topic->id
            ];
        }

        return $data;
    }


    // The admin has no stand-alone inspection list / form: everything lives on the Inspection page.
    public function index()
    {
        return redirect('/inspection');
    }

    public function create()
    {
        return redirect('/inspection');
    }

    public function edit(Inspection $inspection)
    {
        return redirect()->route('inspections.show', $inspection);
    }

    /**
     * Store multiple inspection items
     */
    public function storeMultiple(Request $request)
    {
        $staffID = CompanyStaff::where('user_id', auth()->id())->select('id')->first();

        try {
            $request->validate([
                'project_id'                           => 'required|exists:projects,id',
                'inspection_date'                      => 'required|date',
                'inspection_items'                     => 'required|array|min:1',
                'inspection_items.*.subcon_company_id' => 'required|exists:subcon_company,id',
                'inspection_items.*.location'          => 'required|string|max:255',
                'inspection_items.*.topic_id'          => 'required|exists:toolbox_topic,id',
                'inspection_items.*.evaluation'        => 'required|in:good,poor,nonconformance,clientcomplaint',
                'inspection_items.*.description'       => 'required_unless:inspection_items.*.evaluation,good|string',
                'inspection_items.*.photos'            => 'required_unless:inspection_items.*.evaluation,good|array',
                'inspection_items.*.photos.*'          => 'image|max:2048',
            ]);

            $savedInspections = [];

            foreach ($request->inspection_items as $index => $item) {
                $inspection = new Inspection();
                $inspection->project_id          = $request->project_id;
                $inspection->company_id          = Auth::user()->company_id;
                $inspection->inspection_by       = $staffID->id;
                $inspection->topic_inspection_id = $item['topic_id'];
                $inspection->inspection_date     = $request->inspection_date;
                $inspection->location            = $item['location'];
                $inspection->evaluation          = $item['evaluation'];
                $inspection->description         = $item['description'] ?? null;
                $inspection->subcon_company_id   = $item['subcon_company_id'];
                $inspection->inspectee_id        = null;

                $paths = [];
                foreach ($request->file("inspection_items.{$index}.photos", []) as $photo) {
                    $paths[] = $photo->store('inspections/photos', 'public');
                }
                $inspection->photo = json_encode($paths);
                $inspection->save();

                // Auto-create nonconformance record
                if ($item['evaluation'] === 'nonconformance') {
                    NoConformance::create([
                        'inspection_id' => $inspection->id,
                        'status'        => 'open',
                        'date_open'     => $request->inspection_date,
                        'date_close'    => null,
                        'review_by'     => null,
                        'comment'      => null,
                    ]);
                }

                // Auto-create client complaint record
                if ($item['evaluation'] === 'clientcomplaint') {
                    ClientComplaint::create([
                        'inspection_id' => $inspection->id,
                        'status'        => 'open',
                        'date_open'     => $request->inspection_date,
                        'date_close'    => null,
                        'review_by'     => null,
                        'comment'      => null,
                    ]);
                }

                $savedInspections[] = $inspection->load(['project', 'company', 'topic', 'inspector']);
            }

            return response()->json([
                'success'     => true,
                'message'     => 'Inspections created successfully',
                'inspections' => $savedInspections
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in storeMultiple: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create inspections: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(Request $request, Inspection $inspection)
    {
        $inspection->load(['project', 'company', 'topic', 'inspector', 'subconCompany']);

        // Keep the JSON response for plain API/ajax callers
        if ($request->wantsJson() && !$request->header('X-Inertia')) {
            return response()->json(['inspection' => $inspection]);
        }

        // A company user may only see inspections of their own projects
        $companyId = Auth::user()->company_id;
        if ($companyId && optional($inspection->project)->company_id != $companyId) {
            abort(404);
        }

        $inspection->load(['non_conformance', 'client_complaint']);

        // `photo` holds either a single path (old rows) or a JSON list of paths
        $photos = json_decode((string) $inspection->photo, true);
        if (!is_array($photos)) {
            $photos = $inspection->photo ? [$inspection->photo] : [];
        }

        $reviewerName = function ($record) {
            if (!$record || !$record->review_by) {
                return null;
            }
            return optional(CompanyStaff::find($record->review_by))->name;
        };

        // Other inspections for the same project / subcon, for quick context
        $related = Inspection::with('topic')
            ->where('project_id', $inspection->project_id)
            ->where('id', '!=', $inspection->id)
            ->when($inspection->subcon_company_id, fn ($q) => $q->where('subcon_company_id', $inspection->subcon_company_id))
            ->orderBy('inspection_date', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($i) => [
                'id' => $i->id,
                'topic' => $i->topic->name ?? 'N/A',
                'evaluation' => $i->evaluation,
                'inspection_date' => $i->inspection_date ? $i->inspection_date->format('Y-m-d') : null,
            ])->values();

        $roleId = (int) Auth::user()->role_id;
        $inspection->load(['verifier:id,name', 'approver:id,name']);

        return Inertia::render('WSIS/Inspection_Show', [
            'title' => 'Inspection Details',
            'inspection' => $inspection,
            'can' => [
                'verify'  => in_array($roleId, self::VERIFIER_ROLES, true) && $inspection->status === Inspection::STATUS_PENDING,
                'approve' => in_array($roleId, self::APPROVER_ROLES, true) && $inspection->status === Inspection::STATUS_VERIFIED,
                'reject'  => in_array($roleId, self::VERIFIER_ROLES, true)
                    && in_array($inspection->status, [Inspection::STATUS_PENDING, Inspection::STATUS_VERIFIED], true),
            ],
            'photos' => array_values($photos),
            'ncReviewer' => $reviewerName($inspection->non_conformance),
            'ccReviewer' => $reviewerName($inspection->client_complaint),
            'related' => $related,
        ]);
    }

    // Role ids: 2 Admin Company, 3 Manager, 4 Supervisor, 8 Project Manager
    private const VERIFIER_ROLES = [2, 3, 4, 8];
    private const APPROVER_ROLES = [2, 3, 8];

    private function reviewer(array $roles, Inspection $inspection)
    {
        $user = Auth::user();
        abort_unless(in_array((int) $user->role_id, $roles, true), 403);
        if ($user->company_id && optional($inspection->project)->company_id != $user->company_id) {
            abort(404);
        }

        return CompanyStaff::where('user_id', $user->id)->first();
    }

    /** Supervisor verifies a submitted inspection. */
    public function verify(Inspection $inspection)
    {
        $staff = $this->reviewer(self::VERIFIER_ROLES, $inspection);
        abort_unless($inspection->status === Inspection::STATUS_PENDING, 422, 'Inspection is not awaiting verification.');

        $inspection->update([
            'status' => Inspection::STATUS_VERIFIED,
            'verified_by' => $staff?->id,
            'verified_at' => now(),
            'review_comment' => null,
        ]);

        return back()->with('success', 'Inspection verified.');
    }

    /** Manager gives final approval to a verified inspection. */
    public function approve(Inspection $inspection)
    {
        $staff = $this->reviewer(self::APPROVER_ROLES, $inspection);
        abort_unless($inspection->status === Inspection::STATUS_VERIFIED, 422, 'Inspection must be verified first.');

        $inspection->update([
            'status' => Inspection::STATUS_APPROVED,
            'approved_by' => $staff?->id,
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Inspection approved.');
    }

    /** Send an inspection back to the inspector with a reason. */
    public function reject(Request $request, Inspection $inspection)
    {
        $this->reviewer(self::VERIFIER_ROLES, $inspection);
        abort_unless(in_array($inspection->status, [Inspection::STATUS_PENDING, Inspection::STATUS_VERIFIED], true), 422);
        $data = $request->validate(['comment' => 'required|string|max:1000']);

        $inspection->update([
            'status' => Inspection::STATUS_REJECTED,
            'review_comment' => $data['comment'],
            'verified_by' => null,
            'verified_at' => null,
        ]);

        return back()->with('success', 'Inspection returned to the inspector.');
    }

    /**
     * Update the specified resource.
     */
    public function update(Request $request, Inspection $inspection)
    {
        $currentPhotos = json_decode((string) $inspection->photo, true);
        $currentPhotos = is_array($currentPhotos) ? $currentPhotos : array_filter([$inspection->photo]);
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'company_id' => 'required|exists:executors,id',
            'topic_inspection_id' => 'required|exists:toolbox_topic,id',
            'inspection_name' => 'required|string|max:255',
            'inspection_date' => 'required|date',
            'location' => 'required|string|max:255',
            'evaluation' => 'required|in:good,poor,nonconformance,clientcomplaint',
            'description' => 'required_unless:evaluation,good|string',
            'new_photos' => [\Illuminate\Validation\Rule::requiredIf(fn () => $request->input('evaluation') !== 'good' && count($currentPhotos) === 0), 'array'],
            'new_photos.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            $inspection->update($request->only([
                'project_id',
                'company_id',
                'topic_inspection_id',
                'inspection_name',
                'inspection_date',
                'location',
                'evaluation',
                'description'
            ]));

            // Handle new photo uploads
            if ($request->hasFile('new_photos')) {
                $newPhotoPaths = [];

                foreach ($request->file('new_photos') as $photo) {
                    $path = $photo->store('inspections', 'public');
                    $newPhotoPaths[] = $path;
                }

                $inspection->photo = json_encode(array_merge($currentPhotos, $newPhotoPaths));
                $inspection->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Inspection updated successfully',
                'inspection' => $inspection->load(['project', 'executorCompany', 'topic'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update inspection: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Inspection $inspection)
    {
        try {
            // Delete associated photos
            if ($inspection->photo) {
                foreach ($inspection->photo as $photoPath) {
                    Storage::disk('public')->delete($photoPath);
                }
            }

            $inspection->delete();

            return response()->json([
                'success' => true,
                'message' => 'Inspection deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete inspection: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove specific photos from an inspection
     */
    public function removePhotos(Inspection $inspection, Request $request)
    {
        $request->validate([
            'photo_paths' => 'required|array',
            'photo_paths.*' => 'string'
        ]);

        try {
            $currentPhotos = json_decode((string) $inspection->photo, true);
            $currentPhotos = is_array($currentPhotos) ? $currentPhotos : array_filter([$inspection->photo]);
            $photosToRemove = $request->photo_paths;

            if ($inspection->evaluation !== 'good' && count(array_diff($currentPhotos, $photosToRemove)) === 0) {
                return response()->json(['success' => false, 'message' => 'At least one evidence photo is required.'], 422);
            }

            // Delete files from storage
            foreach ($photosToRemove as $photoPath) {
                Storage::disk('public')->delete($photoPath);
            }

            // Remove from array
            $updatedPhotos = array_diff($currentPhotos, $photosToRemove);
            $inspection->photo = json_encode(array_values($updatedPhotos));
            $inspection->save();

            return response()->json([
                'success' => true,
                'message' => 'Photos removed successfully',
                'inspection' => $inspection
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove photos: ' . $e->getMessage()
            ], 500);
        }
    }

    public function storeToolbox(Request $request)
    {

        $userID = Auth::user()->id;
        $staffID = CompanyStaff::where('user_id', $userID)->select('id')->first();

        $validated = $request->validate([
            'project_id'       => 'required|exists:projects,id',
            'inspection_by'    => 'required|exists:company_staff,id',
            'inspection_date'  => 'required|date',
            'conducted'        => 'required|in:yes,no',
            'attendee_ids'     => 'required|array|min:1',
            'attendee_ids.*'   => 'integer',
            'sp_not_registered' => 'nullable|integer|min:0|max:100000',
            'categories'       => 'nullable|array',
            'categories.*'     => 'integer|exists:toolbox_categories,id',
            'attendance_photo' => 'nullable|image|max:2048',
            'group_photo'      => 'nullable|image|max:2048',
        ], [
            'attendee_ids.required' => 'Select at least one person for Safety Passport sampling.',
            'attendee_ids.min' => 'Select at least one person for Safety Passport sampling.',
        ]);

        // Additional validation if conducted is 'yes'
        if ($validated['conducted'] === 'yes') {
            $request->validate([
                'attendee_ids' => 'required|array|min:1',
                'categories'   => 'required|array|min:1',
            ], [
                'attendee_ids.required' => 'Select at least one staff member who attended.',
                'categories.required'   => 'Select at least one toolbox category.',
            ]);
        }

        // Attendance = the ticked subcontractor staff (only staff that belong to this project)
        $attendeeIds = !empty($validated['attendee_ids'])
            ? \App\Support\ToolboxAttendees::validIds((int) $validated['project_id'], $validated['attendee_ids'], Auth::user()->company_id)
            : [];

        if ($validated['conducted'] === 'yes' && count($attendeeIds) === 0) {
            return back()->withErrors(['attendee_ids' => 'The selected staff do not belong to this project.']);
        }

        // Handle file uploads
        $attendancePhotoPath = null;
        $groupPhotoPath      = null;

        if ($request->hasFile('attendance_photo')) {
            $attendancePhotoPath = $request->file('attendance_photo')->store('toolbox-attendance', 'public');
        }

        if ($request->hasFile('group_photo')) {
            $groupPhotoPath = $request->file('group_photo')->store('toolbox-group', 'public');
        }

        $spSampled = null;
        $spNotRegistered = null;
        if ($validated['conducted'] === 'no' && count($attendeeIds) > 0) {
            $spSampled = count($attendeeIds);
            $spNotRegistered = (int) ($validated['sp_not_registered'] ?? 0);

            if ($spNotRegistered > $spSampled) {
                return back()->withErrors(['sp_not_registered' => "Cannot be more than the {$spSampled} worker(s) sampled."]);
            }
        }

        $spPlan = \App\Support\ToolboxSp::plan($attendeeIds, $request->input('sp'), $request->filled('sp_not_registered') ? (int) $request->input('sp_not_registered') : null);

        // Create the toolbox talk
        $toolboxTalk = ToolboxTalks::create([
            'project_id'      => $validated['project_id'],
            'inspection_by'   => $staffID->id,
            'inspection_date' => $validated['inspection_date'],
            'conducted'       => $validated['conducted'],
            'total_attended'  => count($attendeeIds),
            // Safety Passport sampling only applies to a talk that was NOT conducted;
            // workers sampled = the staff ticked as present.
            'sp_sampled'      => $spSampled,
            'sp_not_registered' => $spNotRegistered,
            'img_attendance'  => $attendancePhotoPath,
            'img_group'       => $groupPhotoPath,
        ]);

        // Attach the selected categories (only when the talk was conducted)
        if ($validated['conducted'] === 'yes' && !empty($validated['categories'])) {
            $toolboxTalk->categories()->sync($validated['categories']);
        }

        if ($attendeeIds) {
            \App\Support\ToolboxAttendees::sync($toolboxTalk, $attendeeIds);
        }
        \App\Support\ToolboxSp::persist($toolboxTalk, $spPlan);

        return redirect()->back()->with('success', 'Toolbox talk created successfully!');
    }

    public function updateNonConformanceStatus(Request $request, NoConformance $nonConformance)
    {
        try {
            $request->validate([
                'status' => 'required|in:open,closed', // Using 'closed' to match your frontend
                'comment' => 'nullable|string|max:1000' // Added comment support
            ]);

            $userID = Auth::user()->id;
            $staffID = CompanyStaff::where('user_id', $userID)->select('id')->first();

            if (!$staffID) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff not found'
                ], 404);
            }

            $nonConformance->status = $request->status;
            $nonConformance->date_close = $request->status === 'closed' ? now() : null;
            $nonConformance->review_by = $staffID->id;

            // Update comment if provided
            if ($request->has('comment') && !empty($request->comment)) {
                $nonConformance->comment = $request->comment;
            }

            $nonConformance->save();

            // Prepare success message
            $message = $request->status === 'closed'
                ? 'Non-conformance has been closed successfully'
                : 'Non-conformance has been reopened successfully';

            if ($request->comment) {
                $message .= ' with comment';
            }

            // return response()->json([
            //     'success' => true,
            //     'message' => $message,
            //     'status' => $request->status
            // ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateClientComplaintStatus(Request $request, ClientComplaint $clientComplaint)
    {
        try {
            $request->validate([
                'status' => 'required|in:open,closed',
                'comment' => 'nullable|string|max:1000'
            ]);

            $userID = Auth::user()->id;
            $staffID = CompanyStaff::where('user_id', $userID)->select('id')->first();

            if (!$staffID) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff not found'
                ], 404);
            }

            $oldStatus = $clientComplaint->status;
            $clientComplaint->status = $request->status;
            $clientComplaint->date_close = $request->status === 'closed' ? now() : null;
            $clientComplaint->review_by = $staffID->id;

            // Update comment if provided
            if ($request->has('comment') && !empty($request->comment)) {
                $clientComplaint->comment = $request->comment;
            }

            $clientComplaint->save();

            // Prepare success message
            $message = $request->status === 'closed'
                ? 'Complaint has been closed successfully'
                : 'Complaint has been reopened successfully';

            if ($request->comment) {
                $message .= ' with comment';
            }

            // Return JSON response for Inertia
            // return response()->json([
            //     'success' => true,
            //     'message' => $message,
            //     'status' => $request->status,
            //     'comment' => $request->comment
            // ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }
}
