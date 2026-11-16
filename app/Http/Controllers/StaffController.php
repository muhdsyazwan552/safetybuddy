<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CompanyStaff;
use App\Models\Company;
use App\Mail\StaffAccountCreated;
use App\Services\CompanySeatLimits;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
    ], [
        // deactivated employees stay in the table, so their email / phone can never be registered again
        'contact.unique' => 'This phone number is already registered (it may belong to a deactivated employee) and cannot be used again.',
        'email.unique' => 'This email is already registered (it may belong to a deactivated employee) and cannot be used again.',
    ]);

    // ✅ Step 2: Get the current authenticated user (admin)
    $admin = Auth::user();

    $staff = DB::transaction(function () use ($admin, $validated) {
        Company::whereKey($admin->company_id)->lockForUpdate()->firstOrFail();
        CompanySeatLimits::assertAvailable((int) $admin->company_id, (int) $validated['role_id']);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['contact']), // the password is always the phone number
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

    // email the new user: login email, password and the steps to sign in (a mail failure never undoes the registration)
    $emailSent = true;
    try {
        Mail::to($validated['email'])->send(new StaffAccountCreated(
            name: $validated['name'],
            email: $validated['email'],
            password: $validated['contact'],
            roleName: optional($staff->role)->display_name ?: optional($staff->role)->name ?: 'Staff',
            companyName: (string) optional(Company::find($admin->company_id))->name,
            loginUrl: route('login'),
        ));
    } catch (\Throwable $e) {
        $emailSent = false;
        Log::warning('Staff login email failed', ['email' => $validated['email'], 'error' => $e->getMessage()]);
    }

    return response()->json([
        'success' => true,
        'message' => 'Staff added successfully',
        'email_sent' => $emailSent,
        'staff'   => $staff,
    ]);
}


/**
 * Update a staff member (name, contact, e-mail and tier). Keeps the linked user login in sync.
 */
public function update(Request $request, $id)
{
    $staff = CompanyStaff::where('company_id', Auth::user()->company_id)->findOrFail($id);

    if ($staff->isInactive()) {
        return response()->json([
            'success' => false,
            'message' => 'This employee is deactivated. The record is kept and cannot be changed or reactivated.',
        ], 422);
    }

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
 * "Delete" a staff member = deactivate. Nothing is removed: inspections, toolbox talks and every other record
 * keep pointing at the employee. The login is blocked for good, the seat is freed, and the email / phone number
 * stay in the table so they can never be registered again. There is no way to reactivate.
 */
public function destroy($id)
{
    $staff = CompanyStaff::where('company_id', Auth::user()->company_id)->findOrFail($id);

    if ($staff->isInactive()) {
        return response()->json(['success' => true, 'message' => 'Staff is already deactivated']);
    }

    $user = $staff->user_id ? User::find($staff->user_id) : null;
    if ($user && in_array((int) $user->role_id, [1, 2], true)) {
        return response()->json(['success' => false, 'message' => 'An admin account cannot be deactivated here.'], 422);
    }

    DB::transaction(function () use ($staff, $user) {
        // stop appearing in project teams; the records they created stay untouched
        DB::table('project_assign')
            ->where('entity_type', 'staff')
            ->where('entity_id', $staff->id)
            ->delete();

        $staff->update(['status' => 'inactive']);

        if ($user) {
            $user->forceFill(['deactivated_at' => now(), 'remember_token' => null])->save();
            if (Schema::hasTable('sessions')) {
                DB::table('sessions')->where('user_id', $user->id)->delete(); // sign out open sessions
            }
        }
    });

    return response()->json([
        'success' => true,
        'message' => 'Staff deactivated. Records are kept and the email and phone number cannot be used again.',
        'staff' => $staff->fresh('role'),
    ]);
}
}
