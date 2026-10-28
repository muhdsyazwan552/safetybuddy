<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CompanyStaff;
use App\Models\Company;
use App\Services\CompanySeatLimits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
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
        'email' => 'required|email|unique:company_staff,email|unique:users,email',
        // only the three tiers can be created here (never e.g. system admin)
        'role_id' => ['required', \Illuminate\Validation\Rule::in([3, 4, 7])],
    ]);

    // ✅ Step 2: Get the current authenticated user (admin)
    $admin = Auth::user();

    $staff = DB::transaction(function () use ($admin, $validated) {
        Company::whereKey($admin->company_id)->lockForUpdate()->firstOrFail();
        CompanySeatLimits::assertAvailable((int) $admin->company_id, (int) $validated['role_id']);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['contact']),
            'phone' => $validated['contact'],
            'company_id' => $admin->company_id,
            'role_id' => $validated['role_id'],
        ]);

        return \App\Support\SeriesCodes::createEmployee((int) $admin->company_id, [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'contact' => $validated['contact'],
            'role_id' => $validated['role_id'],
            'company_id' => $admin->company_id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);
    });
    

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

    DB::transaction(function () use ($staff, $validated) {
        Company::whereKey($staff->company_id)->lockForUpdate()->firstOrFail();
        if ((int) $validated['role_id'] !== (int) $staff->role_id) {
            CompanySeatLimits::assertAvailable((int) $staff->company_id, (int) $validated['role_id'], $staff->id, $staff->user_id);
        }

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
    });

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
