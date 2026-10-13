<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

use App\Models\Project;
use App\Models\ExecutorStaff;
use App\Models\Executor;
use App\Models\User;
use App\Models\ExecutorProjectAssign;
use App\Models\ProjectAssign;
use App\Models\SubconStaff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{

    /**
     * Delete a project together with everything recorded under it:
     * inspections (+ non-conformances, client complaints, photos), toolbox talks
     * (+ topic links, photos), incidents (incident statistic), man-hours and
     * every staff / subcontractor assignment.
     *
     * Staff, subcontractor companies and users themselves are NOT deleted - only
     * their assignment to this project is removed.
     */
    public function destroyProject($id)
    {
        $user = Auth::user();

        $project = Project::findOrFail($id);

        // a company account may only delete its own projects
        if ($user->company_id && $project->company_id != $user->company_id) {
            abort(403, 'You are not allowed to delete this project.');
        }

        $files = [];
        $counts = [];

        try {
            DB::transaction(function () use ($project, &$files, &$counts) {
                $pid = $project->id;

                // --- inspections and what hangs off them
                $inspections = DB::table('inspections')->where('project_id', $pid)->get(['id', 'photo']);
                $inspectionIds = $inspections->pluck('id');

                foreach ($inspections as $row) {
                    $decoded = json_decode((string) $row->photo, true);
                    $paths = is_array($decoded) ? $decoded : array_filter([$row->photo]);
                    foreach ($paths as $path) {
                        $files[] = $path;
                    }
                }

                $counts['non_conformances'] = DB::table('non_conformances')->whereIn('inspection_id', $inspectionIds)->delete();
                $counts['client_complaints'] = DB::table('client_complaints')->whereIn('inspection_id', $inspectionIds)->delete();
                $counts['inspections'] = DB::table('inspections')->where('project_id', $pid)->delete();

                // --- toolbox talks
                $talks = DB::table('toolbox_talks')->where('project_id', $pid)->get(['id', 'img_group', 'img_attendance']);
                foreach ($talks as $talk) {
                    $files[] = $talk->img_group;
                    $files[] = $talk->img_attendance;
                }
                DB::table('toolbox_talks_topics')->whereIn('toolbox_talks_id', $talks->pluck('id'))->delete();
                $counts['toolbox_talks'] = DB::table('toolbox_talks')->where('project_id', $pid)->delete();

                // --- incident statistic
                $incidents = DB::table('incident')->where('project_id', $pid)->get(['id', 'attachment_upload']);
                foreach ($incidents as $incident) {
                    $decoded = json_decode((string) $incident->attachment_upload, true);
                    $paths = is_array($decoded) ? $decoded : array_filter([$incident->attachment_upload]);
                    foreach ($paths as $path) {
                        $files[] = $path;
                    }
                }
                $counts['incidents'] = DB::table('incident')->where('project_id', $pid)->delete();

                // --- man-hours
                $counts['manhours'] = DB::table('manhours')->where('project_id', $pid)->delete();

                // --- assignments only (staff / subcon staff / companies stay untouched)
                $counts['assignments'] = DB::table('project_assign')->where('project_id', $pid)->delete();
                DB::table('project_user_roles')->where('project_id', $pid)->delete();

                $project->delete();
            });
        } catch (\Throwable $e) {
            Log::error('Failed to delete project', ['project_id' => $id, 'error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Could not delete the project. Nothing was removed.');
        }

        // Remove uploaded files only after the database part succeeded
        foreach (array_unique(array_filter($files)) as $path) {
            try {
                Storage::disk('public')->delete($path);
            } catch (\Throwable $e) {
                // a missing file must not break the deletion
            }
        }

        $message = sprintf(
            'Project "%s" deleted with %d inspection(s), %d toolbox talk(s), %d incident(s), %d non-conformance(s), %d client complaint(s) and %d assignment(s).',
            $project->name,
            $counts['inspections'] ?? 0,
            $counts['toolbox_talks'] ?? 0,
            $counts['incidents'] ?? 0,
            $counts['non_conformances'] ?? 0,
            $counts['client_complaints'] ?? 0,
            $counts['assignments'] ?? 0
        );

        return redirect()->route('manage.project')->with('success', $message);
    }

    public function storeProject(Request $request)
    {
        $user = Auth::user();

        // ✅ Only 'name' and 'status' are required, others can be null
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'status'      => 'required|in:pending,in_progress,completed,cancelled',
            'location'    => 'nullable|string|max:255',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'company_id'  => 'nullable|exists:companies,id',
        ]);

        Project::create([
            'name'       => $validated['name'],
            'location'   => $validated['location'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date'   => $validated['end_date'] ?? null,
            'company_id' => $user->company_id, // Auto set from logged-in user
            'status'     => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Project created successfully.');
    }

    public function updateProject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $project = Project::findOrFail($id);
            $project->update([
                'name' => $request->name,
                'location' => $request->location,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => $request->status,
            ]);

            DB::commit();

            // ✅ Return JSON or Inertia partial reload response
            return redirect()
                ->back()
                ->with('message', 'Project updated successfully')
                ->with('updatedProject', $project);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to update project: ' . $e->getMessage());
        }
    }


    public function storeExCompany(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'contact' => 'required|string|max:20',
            'address' => 'required|string'
        ]);

        Executor::create([
            'name' => $validated['name'],
            'short_name' => Executor::generateShortName($validated['name']), // Explicit call
            'email' => $validated['email'],
            'contact' => $validated['contact'],
            'address' => $validated['address'],
            'status' => 'active',
            'company_id' => $user->company_id,
        ]);

        return redirect()->back()->with('success', 'Executor created successfully');
    }


    public function storeExStaff(Request $request)
{
    $validated = $request->validate([
        'company_id' => 'required|exists:subcon_company,id',
        'name' => 'required|string|max:255',
        'role' => 'required|string|max:255',
        'email' => 'nullable|email|max:255|unique:subcon_staff,email',
        'contact' => 'nullable|string|max:50|unique:subcon_staff,contact',
        'status' => 'required|in:active,inactive',
    ]);

    $staff = SubconStaff::create([
        'company_id' => $validated['company_id'],
        'name' => $validated['name'],
        'role' => $validated['role'],
        'email' => $validated['email'] ?? null,
        'contact' => $validated['contact'] ?? null,
        'status' => $validated['status'],
    ]);

    $staff->load('subconCompany');

    // Return JSON response for Inertia
    // return response()->json([
    //     'success' => true,
    //     'message' => 'Staff member added successfully.',
    //     'staff' => $staff
    // ]);

    return redirect()->back()->with('success', 'Executor created successfully');
}


    public function update(Request $request, Executor $executor)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'short_name' => 'sometimes|string|max:10',
            'contact_email' => 'sometimes|email',
            'phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string'
        ]);

        $executor->update($validated);

        return redirect()->back()->with('success', 'Executor updated successfully');
    }

    public function destroy(Executor $executor)
    {
        $executor->delete();
        return redirect()->back()->with('success', 'Executor deleted successfully');
    }


    public function addExecutor(Project $project, Request $request)
    {
        $validated = $request->validate([
            'entity_type' => 'required|in:staff,subcon,compsub',
            'executor_id' => [
                'required',
                function ($attribute, $value, $fail) use ($request, $project) {
                    // Check if entity already exists based on type
                    $exists = $project->projectAssign()
                        ->where('entity_type', $request->entity_type)
                        ->where('entity_id', $value)
                        ->exists();

                    if ($exists) {
                        $entityType = $request->entity_type === 'staff' ? 'main staff' : ($request->entity_type === 'subcon' ? 'subcontractor' : 'company subcontractor');
                        $fail("This {$entityType} is already assigned to the project.");
                    }
                }
            ],
            'role_assignment' => 'required|string|max:255'
        ]);

        try {
            // Determine which table to validate against based on entity_type
            $table = match ($validated['entity_type']) {
                'staff' => 'company_staff',
                'subcon' => 'subcon_staff',
                'compsub' => 'subcon_company', // ← FIXED: Use subcon_company table
            };

            // Additional validation for existence in the correct table
            $request->validate([
                'executor_id' => "exists:{$table},id"
            ]);

            ProjectAssign::create([
                'project_id' => $project->id,
                'entity_type' => $validated['entity_type'],
                'entity_id' => $validated['executor_id'],
                'role_assignment' => $validated['role_assignment']
            ]);

            $typeName = match ($validated['entity_type']) {
                'staff' => 'Main Staff',
                'subcon' => 'Subcontractor Staff',
                'compsub' => 'Company Subcontractor',
            };

            return redirect()->back()->with([
                'message' => "{$typeName} added successfully!",
                'type' => 'success'
            ]);
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->with([
                'message' => 'Failed to add executor: ' . $e->getMessage(),
                'type' => 'error'
            ])->withInput();
        }
    }


    public function updateAssignment(Request $request, $id)
    {
        $validated = $request->validate([
            'role_assignment' => 'required|string|max:255',
        ]);

        $assignment = ExecutorProjectAssign::where('id', $id)
            ->firstOrFail();

        $assignment->update([
            'role_assignment' => $validated['role_assignment']
        ]);

        return back()->with('success', 'Assignment updated successfully.');
    }

    public function destroyAssignment($id)
    {
        $assignment = ExecutorProjectAssign::where('id', $id)
            ->where('company_id', Auth::user()->company_id)
            ->firstOrFail();

        $assignment->delete();

        return back()->with('success', 'Assignment deleted successfully.');
    }
}
