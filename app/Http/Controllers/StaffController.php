<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CompanyStaff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Illuminate\Validation\Rules;

class StaffController extends Controller
{


public function store(Request $request)
{
    // ✅ Step 1: Validate staff input
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'contact' => 'required|string|unique:company_staff,contact', // Changed from 'phone' to 'contact'
        'email' => 'nullable|email|unique:company_staff,email',
        // only the three tiers can be created here (never e.g. system admin)
        'role_id' => ['required', \Illuminate\Validation\Rule::in([3, 4, 7])],
    ]);

    // ✅ Step 2: Get the current authenticated user (admin)
    $admin = Auth::user();

    // ✅ Step 3: Create staff in company_staff table
    $staff = CompanyStaff::create([
        'name'       => $validated['name'],
        'email'      => $validated['email'] ?? null,
        'contact'    => $validated['contact'], // Using 'contact' column
        'role_id'    => $validated['role_id'],
        'company_id' => $admin->company_id,
        'status'     => 'active' // Default status
    ]);

    // ✅ Optional: Also create a user account if needed
    // Uncomment this if you want to also create a user account
    
    $user = User::create([
        'name'       => $validated['name'],
        'email'      => $validated['email'],
        'password'   => Hash::make($validated['contact']),
        'phone'      => $validated['contact'],
        'company_id' => $admin->company_id,
        'role_id'    => $validated['role_id'],
    ]);
    
    // Link the user_id in company_staff
    $staff->update(['user_id' => $user->id]);
    

    // Load the role relationship
    $staff->load('role');

    return response()->json([
        'success' => true,
        'message' => 'Staff added successfully',
        'staff'   => $staff,
    ]);
}


/**
 * Update a staff member (name, contact, e-mail and tier). Keeps the linked user login in sync.
 */
public function update(Request $request, $id)
{
    $staff = CompanyStaff::where('company_id', Auth::user()->company_id)->findOrFail($id);

    $allowedRoles = [3, 4, 7];
    // a legacy role (e.g. old "Project Manager") may stay untouched while other fields are edited
    if ($staff->role_id && !in_array((int) $staff->role_id, $allowedRoles, true)) {
        $allowedRoles[] = (int) $staff->role_id;
    }

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'contact' => ['required', 'string', \Illuminate\Validation\Rule::unique('company_staff', 'contact')->ignore($staff->id)],
        'email' => ['nullable', 'email', \Illuminate\Validation\Rule::unique('company_staff', 'email')->ignore($staff->id)],
        'role_id' => ['required', \Illuminate\Validation\Rule::in($allowedRoles)],
    ]);

    $staff->update([
        'name' => $validated['name'],
        'contact' => $validated['contact'],
        'email' => $validated['email'] ?? null,
        'role_id' => $validated['role_id'],
    ]);

    if ($staff->user_id && ($user = User::find($staff->user_id)) && !in_array((int) $user->role_id, [1, 2], true)) {
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? $user->email,
            'phone' => $validated['contact'],
            'role_id' => $validated['role_id'],
        ]);
    }

    $staff->load('role');

    return response()->json(['success' => true, 'message' => 'Staff updated successfully', 'staff' => $staff]);
}

/**
 * Delete a staff member - refused while inspections / toolbox talks still belong to them.
 */
public function destroy($id)
{
    $staff = CompanyStaff::where('company_id', Auth::user()->company_id)->findOrFail($id);

    $inspections = \App\Models\Inspection::where('inspection_by', $staff->id)->count();
    $talks = \App\Models\ToolboxTalks::where('inspection_by', $staff->id)->count();

    if ($inspections || $talks) {
        return response()->json([
            'success' => false,
            'message' => "{$staff->name} still has {$inspections} inspection(s) and {$talks} toolbox talk(s) recorded. "
                . 'Keep the record so the history stays correct.',
        ], 422);
    }

    \Illuminate\Support\Facades\DB::transaction(function () use ($staff) {
        \Illuminate\Support\Facades\DB::table('project_assign')
            ->where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->delete();

        if ($staff->user_id) {
            $user = User::find($staff->user_id);
            if ($user && !in_array((int) $user->role_id, [1, 2], true)) {
                $user->delete();
            }
        }

        $staff->delete();
    });

    return response()->json(['success' => true, 'message' => 'Staff deleted successfully']);
}
}