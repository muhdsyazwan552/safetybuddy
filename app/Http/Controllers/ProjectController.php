<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

use App\Models\Project;
use App\Models\ExecutorStaff;
use App\Models\Executor;
use App\Models\User;
use App\Models\ExecutorProjectAssign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{

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
            'executor_company_id' => 'required|exists:executor_companies,id', // 👈 Validate it
            'name'                => 'required|string|max:255',
            'role'                => 'required|string|max:255',
            'email'               => 'nullable|email|max:255',
            'contact'             => 'nullable|string|max:50',
            'status'              => 'required|in:active,inactive',
        ]);


        ExecutorStaff::create([
            'executor_company_id' => $validated['executor_company_id'],
            'name' => $validated['name'],
            'role' => $validated['role'],
            'email' => $validated['email'],
            'contact' => $validated['contact'],
            'status' => $validated['status'],

        ]);

        return back()->with('success', 'Staff member added successfully.');
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


    // assign employee or company in project
    public function addExecutor(Project $project, Request $request)
    {
        $validated = $request->validate([
            'entity_type' => 'required|in:CP,EM', // CP = Company, EM = Employee
            'executor_id' => [
                'required',
                function ($attribute, $value, $fail) use ($request, $project) {
                    // Check if entity already exists based on type
                    $exists = $project->executorAssignments()
                        ->where('entity_type', $request->entity_type)
                        ->where('entity_id', $value)
                        ->exists();

                    if ($exists) {
                        $entityType = $request->entity_type === 'CP' ? 'company' : 'employee';
                        $fail("This {$entityType} is already assigned to the project.");
                    }
                }
            ],
            'role_assignment' => 'required|string|max:255'
        ]);

        try {
            // Determine which table to validate against based on entity_type
            $table = $validated['entity_type'] === 'CP' ? 'executor_companies' : 'users';

            // Additional validation for existence in the correct table
            $request->validate([
                'executor_id' => "exists:{$table},id"
            ]);

            ExecutorProjectAssign::create([
                'project_id' => $project->id,
                'entity_type' => $validated['entity_type'],
                'entity_id' => $validated['executor_id'],
                'role_assignment' => $validated['role_assignment']
            ]);

            return redirect()->back()->with([
                'message' => ucfirst($validated['entity_type'] === 'CP' ? 'Company' : 'Employee') . ' added successfully!',
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
