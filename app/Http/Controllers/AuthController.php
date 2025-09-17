<?php

namespace App\Http\Controllers;


use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{

public function login()
    {
        return Inertia::render('Admin/Login');
    }

public function authenticate(Request $request)
    {
        Log::debug('Login attempt started', ['email' => $request->email]);
        
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'nullable|string'
        ]);

        Log::debug('Validated credentials', $credentials);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            Log::debug('User not found', ['email' => $credentials['email']]);
            throw ValidationException::withMessages([
                'email' => 'The provided email does not exist.',
            ]);
        }

        if (!Auth::attempt([
            'email' => $credentials['email'],
            'password' => $credentials['password']
        ], $request->remember === 'on')) {
            Log::debug('Authentication failed', ['email' => $credentials['email']]);
            throw ValidationException::withMessages([
                'password' => 'The provided password is incorrect.',
            ]);
        }

        Log::debug('Authentication successful', ['user_id' => $user->id]);
        $request->session()->regenerate();

        return redirect()->intended('/dashboard');
    }




    public function register()
    {
        return Inertia::render('Admin/Register', [
           
        ]);
    }

public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|confirmed|min:8',
        'account_type' => 'required|in:personal,company',
        'phone' => 'required|string|max:20',
        'address' => 'required|string',
        'terms' => 'accepted'
    ]);

    $companyId = null;

    // If registering as a company, create company record first
    if ($validated['account_type'] === 'company') {
        $company = \App\Models\Company::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'address' => $validated['address'],
            // Add other fields like registration_no if needed
        ]);

        $companyId = $company->id;
    }

    // Now create the user (admin or personal)
    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        
        'phone' => $validated['phone'],
        'address' => $validated['address'],
        'company_id' => $companyId,
        'role_id' => ($validated['account_type'] === 'company') ? 1 : null, // Set 'Manager' or 'Admin' role
    ]);

    return response()->json([
        'success' => true,
        'redirect' => '/login'
    ]);
}


    public function listProject()
    {
        return Inertia::render('Admin/ListProject', [
           
        ]);
    }

    public function index()
    {
        return Inertia::render('Admin/Dashboard', [
           
        ]);
    }
}