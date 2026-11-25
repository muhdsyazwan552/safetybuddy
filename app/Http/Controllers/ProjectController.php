<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

use App\Models\Project;
use App\Models\ExecutorStaff;
use App\Models\SubconCompany as Executor; // executors are SubconCompany records
use App\Models\User;
use App\Models\ProjectAssign;
use App\Models\SubconStaff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{

    /** Records that hang off a project. Any of them means the project must be kept (set inactive), not deleted. */
    public static function dataCounts(int $projectId): array
    {
        $tables = [
            'inspections' => 'Inspections',
            'toolbox_talks' => 'Toolbox talks',
            'incident' => 'Incidents',
            'manhours' => 'Man-hour records',
            'manhour_attendances' => 'Attendance records',
            'inspection_reports' => 'Daily reports',
            'monthly_reports' => 'Monthly reports',
        ];
        $out = [];
        foreach ($tables as $table => $label) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'project_id')) {
                continue;
            }
            $n = DB::table($table)->where('project_id', $projectId)->count();
            if ($n > 0) {
                $out[$label] = $n;
            }
        }

        return $out;
    }

    /**
     * A project that already has recorded data is only set to inactive (nothing is lost).
     * A project without any data is deleted permanently, together with its assignments.
     */
    public function destroyProject($id)
    {
        $user = Auth::user();
        $project = Project::findOrFail($id);

        // a company account may only manage its own projects
        if ($user->company_id && $project->company_id != $user->company_id) {
            abort(403, 'You are not allowed to delete this project.');
        }

        $counts = self::dataCounts($project->id);

        if (!empty($counts)) {
            $project->update(['status' => 'inactive']);

            return redirect()->back()->with('success', sprintf(
                'Project "%s" already has recorded data, so it was set to inactive instead of being deleted.',
                $project->name
            ));
        }

        try {
            DB::transaction(function () use ($project) {
                DB::table('project_assign')->where('project_id', $project->id)->delete();
                DB::table('project_user_roles')->where('project_id', $project->id)->delete();
                $project->delete();
            });
        } catch (\Throwable $e) {
            Log::error('Failed to delete project', ['project_id' => $id, 'error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Could not delete the project. Nothing was removed.');
        }

        return redirect()->route('manage.project')->with('success', sprintf('Project "%s" was deleted permanently.', $project->name));
    }

    public function storeProject(Request $request)
    {
        $user = Auth::user();

        // ✅ Only 'name' and 'status' are required, others can be null
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'status'      => 'required|in:pending,in_progress,completed,cancelled,inactive',
            'location'    => 'nullable|string|max:255',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'company_id'  => 'nullable|exists:companies,id',
            'project_type_id' => 'nullable|exists:project_types,id',
            'inspector_id' => ['nullable', \Illuminate\Validation\Rule::exists('company_staff', 'id')
                ->where('company_id', $user->company_id)->where('role_id', UserRole::Inspector->value)
                ->where(fn ($q) => $q->whereNull('status')->orWhere('status', '!=', 'inactive'))],
            'contractor_id' => ['nullable', \Illuminate\Validation\Rule::exists('subcon_company', 'id')
                ->where('company_id', $user->company_id)->where('status', 'active')],
            'contractor_notes' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $user) {
        $project = Project::create([
            'name'       => $validated['name'],
            'location'   => $validated['location'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date'   => $validated['end_date'] ?? null,
            'company_id' => $user->company_id, // Auto set from logged-in user
            'status'     => $validated['status'],
            'project_type_id' => $validated['project_type_id'] ?? null,
        ]);

        if (!empty($validated['inspector_id'])) {
            ProjectAssign::create([
                'project_id' => $project->id, 'entity_type' => 'staff',
                'entity_id' => $validated['inspector_id'], 'role_assignment' => 'Inspector',
            ]);
        }
        if (!empty($validated['contractor_id'])) {
            ProjectAssign::create([
                'project_id' => $project->id, 'entity_type' => 'compsub',
                'entity_id' => $validated['contractor_id'],
                'role_assignment' => 'Contractor',
                'notes' => trim($validated['contractor_notes'] ?? '') ?: null,
            ]);
        }
        });

        return redirect()->back()->with('success', 'Project created successfully.');
    }

    public function updateProject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|in:pending,in_progress,completed,cancelled,inactive',
            'project_type_id' => 'nullable|exists:project_types,id',
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
                'project_type_id' => $request->project_type_id ?: null,
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

        abort_unless($user->company_id, 403, 'No company is linked to your account.');

        DB::transaction(function () use ($user, $validated) {
            // Serialize creation per company so two requests cannot claim the last slot.
            \App\Models\Company::whereKey($user->company_id)->lockForUpdate()->firstOrFail();
            \App\Services\CompanySeatLimits::assertExecutorAvailable((int) $user->company_id);

            // A new executor stays Inactive until its leader acknowledges the Safety Passport rules.
            \App\Support\SeriesCodes::createSubconCompany((int) $user->company_id, [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'contact' => $validated['contact'],
                'address' => $validated['address'],
                'status' => 'Inactive',
                'company_id' => $user->company_id,
            ]);
        });

        return redirect()->back()->with('success', 'Contractor company created successfully');
    }


    public function storeExStaff(Request $request)
{
    $validated = $request->validate([
        'company_id' => ['required', \Illuminate\Validation\Rule::exists('subcon_company', 'id')->where('company_id', Auth::user()->company_id)],
        'name' => 'required|string|max:255',
        'role' => 'required|string|max:255',
        'email' => 'nullable|email|max:255|unique:subcon_staff,email',
        'contact' => ['required', 'string', 'max:20', 'regex:/^[0-9+\-\s()]{7,20}$/', 'unique:subcon_staff,contact'],
        'status' => 'required|in:active,inactive',
    ], [
        'contact.required' => 'Phone number is required.',
        'contact.regex' => 'Enter a valid phone number, e.g. 012-345 6789.',
    ]);

    $staff = \App\Support\SeriesCodes::createSubconStaff((int) $validated['company_id'], [
        'company_id' => $validated['company_id'],
        'name' => $validated['name'],
        'role' => $validated['role'],
        'email' => ($validated['email'] ?? null) ?: null,
        'contact' => $validated['contact'],
        'status' => $validated['status'],
    ]);

    $staff->load('subconCompany');

    // Return JSON response for Inertia
    // return response()->json([
    //     'success' => true,
    //     'message' => 'Staff member added successfully.',
    //     'staff' => $staff
    // ]);

    return redirect()->back()->with('success', 'Contractor staff added successfully');
}


    public function update(Request $request, Executor $executor)
    {
        abort_unless((int) $executor->company_id === (int) Auth::user()->company_id, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'contact' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string'],
        ]);

        $executor->update($validated);

        return redirect()->back()->with('success', 'Contractor company updated successfully');
    }

    public function destroy(Executor $executor)
    {
        abort_unless((int) $executor->company_id === (int) Auth::user()->company_id, 403);

        $hasAssignments = DB::table('project_assign')
            ->whereIn('entity_type', ['compsub', 'subcon'])
            ->where('entity_id', $executor->id)
            ->exists();
        $hasStaff = $executor->subconStaff()->exists();
        $historyTables = [
            'subcon_induction_acks', 'subcon_machineries', 'manhours', 'manhour_attendances',
            'incident', 'inspections', 'inspection_reports', 'monthly_reports', 'toolbox_talk_sp',
        ];
        $hasHistory = collect($historyTables)->contains(fn ($table) => Schema::hasTable($table)
            && Schema::hasColumn($table, 'subcon_company_id')
            && DB::table($table)->where('subcon_company_id', $executor->id)->exists());
        if ($hasAssignments || $hasStaff || $hasHistory) {
            throw ValidationException::withMessages([
                'company' => 'This executor has staff, project assignments, or recorded history. Remove those links before deleting the company.',
            ]);
        }

        $executor->delete();
        return redirect()->back()->with('success', 'Contractor company deleted successfully');
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
            'role_assignment' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
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
                'role_assignment' => trim($validated['role_assignment'] ?? '')
                    ?: ($validated['entity_type'] === 'staff' ? 'Inspector' : 'Contractor'),
                'notes' => trim($validated['notes'] ?? '') ?: null,
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


    /** Assignment rows of the logged-in company's projects only. */
    private function ownAssignment($id)
    {
        $row = DB::table('project_assign')
            ->join('projects', 'projects.id', '=', 'project_assign.project_id')
            ->where('project_assign.id', $id)
            ->where('projects.company_id', Auth::user()->company_id)
            ->select('project_assign.id')
            ->first();

        abort_unless($row, 404);

        return DB::table('project_assign')->where('id', $row->id);
    }

    public function updateAssignment(Request $request, $id)
    {
        $validated = $request->validate([
            'role_assignment' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $this->ownAssignment($id)->update([
            'role_assignment' => trim($validated['role_assignment'] ?? '') ?: 'Assigned',
            'notes' => trim($validated['notes'] ?? '') ?: null,
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Assignment updated successfully.');
    }

    public function destroyAssignment($id)
    {
        $this->ownAssignment($id)->delete();

        return back()->with('success', 'Assignment deleted successfully.');
    }
}
