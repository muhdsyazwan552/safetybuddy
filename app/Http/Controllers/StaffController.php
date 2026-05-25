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
        'role_id' => 'required|exists:roles,id',
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

}