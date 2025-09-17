<?php

namespace App\Http\Controllers;

use App\Models\User;
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
    // ✅ Step 1: Validate staff input (no address, no terms)
    $validated = $request->validate([
    'name' => 'required|string|max:255',
    'phone' => 'required|string|unique:users,phone',
    'email' => 'nullable|email|unique:users,email',
    'role_id' => 'required|exists:roles,id',
    ]);

    // ✅ Step 2: Get the current authenticated user (admin)
    $admin = Auth::user();

    // ✅ Step 3: Create staff user linked to the same company
    $staff = User::create([
        'name'       => $validated['name'],
        'email'      => $validated['email'],
        'password'   => Hash::make($validated['phone']), // 🔐 Password is phone number
        'phone'      => $validated['phone'],
        'company_id' => $admin->company_id,  // Inherit from admin
        'role_id'    => $validated['role_id'],
        
    ]);

    // Load the role relationship
    $staff->load('role');

    return response()->json([
        'success' => true,
        'message' => 'Staff registered successfully',
        'staff'   => $staff,
    ]);
}

}