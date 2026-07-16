<?php

namespace App\Http\Controllers;


use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AuthController extends Controller
{

    public function login()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function authenticate(Request $request)
    {
        Log::debug('Login attempt started', ['email' => $request->email]);

        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'nullable|string'
        ]);

        Log::debug('Validated credentials', ['email' => $credentials['email']]);

        // Attempt to authenticate
        if (Auth::attempt([
            'email' => $credentials['email'],
            'password' => $credentials['password']
        ], $request->remember === 'on')) {

            Log::debug('Authentication successful', ['user_id' => Auth::id()]);
            $request->session()->regenerate();

            // Get the authenticated user
            $user = Auth::user();
            $role_id = $user->role_id;

            Log::debug('User role detected', ['role_id' => $role_id, 'user_id' => $user->id]);

            // Role-based redirection
            $redirectPath = $this->getRedirectPathByRole($role_id);

            return redirect()->intended($redirectPath);
        }

        Log::debug('Authentication failed', ['email' => $credentials['email']]);

        throw ValidationException::withMessages([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }

    /**
     * Get redirect path based on user role
     */
    protected function getRedirectPathByRole($role_id)
    {
        if ($role_id == 1) {
            return '/admin/dashboard';
        }

        // Role 2 goes to /module
        if ($role_id == 2) {
            return '/module';
        }

        // Roles 4, 7, 8 go to inspector dashboard
        if (in_array($role_id, [4, 7, 8])) {
            return '/inspector/dashboard';
        }

        // Default fallback for other roles
        return '/index';
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }


    public function register()
    {
        return Inertia::render('Auth/Register', []);
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
        return Inertia::render('WSIS/ListProject', []);
    }

    public function index()
    {
        return Inertia::render('Admin/Dashboard', []);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
