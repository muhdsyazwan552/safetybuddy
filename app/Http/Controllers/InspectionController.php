<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\Executor;
use App\Models\Project;
use App\Models\ToolboxTopic;
use App\Models\ToolboxTalks;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log; // Add this import
use Inertia\Inertia;

class InspectionController extends Controller
{
public function dashboard(Request $request)
{

   $companyId = Auth::user()->company_id;

   $selectedProjectId = $request->get('project_id');

    logger('Selected Project ID:', ['project_id' => $selectedProjectId]);

    
   $userProjectCount = Project::where('company_id', $companyId)->count();
   $userEmployeeCount = User::where('company_id', $companyId)->where('role_id', '4')->count();
   $userExecutorCount = Executor::where('company_id', $companyId)->count();
   $userInspectionCount = Inspection::whereHas('project', function ($query) use ($companyId) {
        $query->where('company_id', $companyId);
    })
    ->with(['project', 'executorCompany', 'topic', 'creator'])
    ->count();


    $inspections = Inspection::with(['project', 'executorCompany', 'topic', 'creator'])
    ->latest();

// ✅ If project is selected, only load inspections for that project
if ($selectedProjectId) {
    $inspections->where('project_id', $selectedProjectId);
}

$inspections = $inspections->get();

    $projects = Project::all();
    $all_companies = collect();
    if ($selectedProjectId) {
        $project = Project::with('executorCompanies.executorCompany')->find($selectedProjectId);
        if ($project) {
            $all_companies = $project->executorCompanies->pluck('executorCompany');
        }
    } else {
        // default: all companies
        $all_companies = Executor::all();
    }
    $topics = ToolboxTopic::all();

    // Generate chart data
    $executorChartData = $this->getInspectionsByExecutorData($inspections, $all_companies, $selectedProjectId);
    $projectChartData = $this->getInspectionsByProjectData($inspections, $projects);
    $findingsSummary = $this->getFindingsSummary($inspections);
    $topicChartData = $this->getInspectionsByTopicData($inspections, ToolboxTopic::all());

    return Inertia::render('Contents/Dashboard_Inspection', [
        'title' => 'Inspections Management',
        'inspections' => $inspections,
        'projects' => $projects,
        'all_companies' => $all_companies,
        'topics' => $topics,
        'executor_chart_data' => $executorChartData, // Add this
        'project_chart_data' => $projectChartData,
        'findings_summary' => $findingsSummary,
        'topic_chart_data' => $topicChartData,
        'user_project_count' => $userProjectCount,
        'user_employee_count' => $userEmployeeCount,
        'user_executor_count' => $userExecutorCount,
        'user_inspection_count' => $userInspectionCount
    ]);
}

private function getInspectionsByExecutorData($inspections, $all_companies, $selectedProjectId = null, $projects = null)
{
    $data = [];
    
    // Filter inspections by project if selected
   
    
    // Group inspections by company
    $inspectionsByCompany = $inspections->groupBy('executor_companies_id');
    
    foreach ($all_companies as $company) {
        $companyInspections = $inspectionsByCompany->get($company->id, collect());

       if ($selectedProjectId) {
        $companyInspections = $inspections->where('project_id', $selectedProjectId)->first();
    }
        
        $data[] = [
            'name'            => $company->name,
            'short_name'      => $company->short_name,
            'count'           => $companyInspections->count(),
            'good'            => $companyInspections->where('evaluation', 'good')->count(),
            'moderate'        => $companyInspections->where('evaluation', 'moderate')->count(),
            'poor'            => $companyInspections->where('evaluation', 'poor')->count(),
            'nonconformance'  => $companyInspections->where('evaluation', 'nonconformance')->count(),
            'clientcomplaint' => $companyInspections->where('evaluation', 'clientcomplaint')->count(),
            'company_id'      => $company->id,
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
            'moderate' => $projectInspections->where('evaluation', 'moderate')->count(),
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

private function getFindingsSummary($inspections)
{
    $total = $inspections->count();

    $summary = [
        'good' => [
            'topics' => $inspections->where('evaluation', 'good')->pluck('topic.name')->unique()->values(),
            'count' => $inspections->where('evaluation', 'good')->count(),
        ],
        'moderate' => [
            'topics' => $inspections->where('evaluation', 'moderate')->pluck('topic.name')->unique()->values(),
            'count' => $inspections->where('evaluation', 'moderate')->count(),
        ],
        'poor' => [
            'topics' => $inspections->where('evaluation', 'poor')->pluck('topic.name')->unique()->values(),
            'count' => $inspections->where('evaluation', 'poor')->count(),
        ],
        'nonconformance' => [
            'topics' => $inspections->where('evaluation', 'nonconformance')->pluck('topic.name')->unique()->values(),
            'count' => $inspections->where('evaluation', 'nonconformance')->count(),
        ],
        'clientcomplaint' => [
            'topics' => $inspections->where('evaluation', 'clientcomplaint')->pluck('topic.name')->unique()->values(),
            'count' => $inspections->where('evaluation', 'clientcomplaint')->count(),
        ],
    ];

    // Add percentages
    foreach ($summary as $key => $row) {
        $summary[$key]['percent'] = $total > 0 ? round(($row['count'] / $total) * 100) : 0;
    }

    return [
        'summary' => $summary,
        'total' => $total,
    ];
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
            'moderate' => $topicInspections->where('evaluation', 'moderate')->count(),
            'poor' => $topicInspections->where('evaluation', 'poor')->count(),
            'nonconformance' => $topicInspections->where('evaluation', 'nonconformance')->count(),
            'clientcomplaint' => $topicInspections->where('evaluation', 'clientcomplaint')->count(),
            'topic_id' => $topic->id
        ];
    }
    
    return $data;
}


    /**
     * Store multiple inspection items
     */
public function storeMultiple(Request $request)
{
    try {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'inspection_date' => 'required|date',
            'inspection_items' => 'required|array|min:1',
            'inspection_items.*.company_id' => '',
            'inspection_items.*.inspection_name' => 'required|string|max:255',
            'inspection_items.*.location' => 'required|string|max:255',
            'inspection_items.*.topic_id' => 'required|exists:toolbox_topic,id',
            'inspection_items.*.evaluation' => 'required|in:good,moderate,poor,nonconformance,clientcomplaint',
            'inspection_items.*.description' => 'required|string',
        ]);

        $savedInspections = [];

        foreach ($request->inspection_items as $item) {
            $inspection = new Inspection();
            $inspection->project_id = $request->project_id;
            $inspection->executor_companies_id = $item['company_id'];
            $inspection->topic_inspection_id = $item['topic_id'];
            $inspection->inspection_name = $item['inspection_name'];
            $inspection->inspection_date = $request->inspection_date;
            $inspection->location = $item['location'];
            $inspection->evaluation = $item['evaluation'];
            $inspection->description = $item['description'];
            $inspection->created_by = Auth::id();

            $inspection->save();
            $savedInspections[] = $inspection->load(['project', 'executorCompany', 'topic']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inspections created successfully',
            'inspections' => $savedInspections
        ]);

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
    public function show(Inspection $inspection)
    {
        return response()->json([
            'inspection' => $inspection->load(['project', 'executorCompany', 'topic', 'creator'])
        ]);
    }

    /**
     * Update the specified resource.
     */
    public function update(Request $request, Inspection $inspection)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'executor_companies_id' => 'required|exists:executors,id',
            'topic_inspection_id' => 'required|exists:toolbox_topic,id',
            'inspection_name' => 'required|string|max:255',
            'inspection_date' => 'required|date',
            'location' => 'required|string|max:255',
            'evaluation' => 'required|string|max:50',
            'description' => 'required|string',
            'new_photos' => 'nullable|array',
            'new_photos.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            $inspection->update($request->only([
                'project_id', 'executor_companies_id', 'topic_inspection_id',
                'inspection_name', 'inspection_date', 'location',
                'evaluation', 'description'
            ]));

            // Handle new photo uploads
            if ($request->hasFile('new_photos')) {
                $currentPhotos = $inspection->photo ?? [];
                $newPhotoPaths = [];
                
                foreach ($request->file('new_photos') as $photo) {
                    $path = $photo->store('inspections', 'public');
                    $newPhotoPaths[] = $path;
                }
                
                $inspection->photo = array_merge($currentPhotos, $newPhotoPaths);
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
            $currentPhotos = $inspection->photo ?? [];
            $photosToRemove = $request->photo_paths;

            // Delete files from storage
            foreach ($photosToRemove as $photoPath) {
                Storage::disk('public')->delete($photoPath);
            }

            // Remove from array
            $updatedPhotos = array_diff($currentPhotos, $photosToRemove);
            $inspection->photo = array_values($updatedPhotos); // Reindex array
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
    $validated = $request->validate([
        'project_id' => 'required|exists:projects,id',
        'inspection_name' => 'required|string|max:255',
        'inspection_date' => 'required|date',
        'conducted' => 'required|in:yes,no',
        'attendance' => 'nullable|integer|min:0',
        'topics' => 'nullable|array',
        'topics.*' => 'integer', // Validate that each topic is an integer
        'attendance_photo' => 'nullable|image|max:2048',
        'group_photo' => 'nullable|image|max:2048'
    ]);

    // Additional validation if conducted is 'yes'
    if ($validated['conducted'] === 'yes') {
        $request->validate([
            'attendance' => 'required|integer|min:1',
            'topics' => 'required|array|min:1',
        ]);
    }

    // Handle file uploads
    $attendancePhotoPath = null;
    $groupPhotoPath = null;
    
    if ($request->hasFile('attendance_photo')) {
        $attendancePhotoPath = $request->file('attendance_photo')->store('toolbox-attendance', 'public');
    }
    
    if ($request->hasFile('group_photo')) {
        $groupPhotoPath = $request->file('group_photo')->store('toolbox-group', 'public');
    }

    // Create the toolbox talk
    $toolboxTalk = ToolboxTalks::create([
        'project_id' => $validated['project_id'],
        'inspection_name' => $validated['inspection_name'],
        'inspection_date' => $validated['inspection_date'],
        'conducted' => $validated['conducted'],
        'total_attended' => $validated['attendance'] ?? 0,
        'img_attendance' => $attendancePhotoPath,
        'img_group' => $groupPhotoPath
    ]);

    // Attach topics if conducted is 'yes' and topics are provided
    if ($validated['conducted'] === 'yes' && !empty($validated['topics'])) {
        $toolboxTalk->topics()->attach($validated['topics']);
    }

    return redirect()->back()->with('success', 'Toolbox talk created successfully!');
}
    
}