<?php

namespace App\Http\Controllers;


use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
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

            if ($role_id == 2 && $user->email_verification_required && ! $user->hasVerifiedEmail()) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                $request->session()->put('verification_email', $user->email);

                return redirect()->route('verification.notice');
            }

            Log::debug('User role detected', ['role_id' => $role_id, 'user_id' => $user->id]);

            // Role-based redirection
            $redirectPath = $this->getRedirectPathByRole($role_id);

            return $role_id == 2 ? redirect()->to($redirectPath) : redirect()->intended($redirectPath);
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

        // Company accounts go straight to the dashboard when their package is active.
        if ($role_id == 2) {
            return \App\Http\Controllers\SubscriptionPlanController::hasActiveSafety((int) Auth::user()->company_id)
                ? '/dashboard'
                : '/plans';
        }

        // Manager (3) and Supervisor (4) use the review portal
        if (in_array($role_id, [3, 4])) {
            return '/review/dashboard';
        }

        // Roles 7, 8 go to inspector dashboard
        if (in_array($role_id, [7, 8])) {
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
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:50|unique:users',
            'password' => 'required|confirmed|min:8',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'terms' => 'accepted'
        ]);

        $user = DB::transaction(function () use ($validated) {
            $companyId = \App\Support\SeriesCodes::createCompany([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'address' => $validated['address'],
                'contact' => $validated['phone'],
                'status' => 'active',
            ])->id;

            return User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'company_id' => $companyId,
                'role_id' => 2,
                'email_verification_required' => true,
            ]);
        });

        if ($request->hasSession()) {
            $request->session()->put('verification_email', $user->email);
            $request->session()->forget('verification_delivery_failed');
        }

        try {
            event(new Registered($user));
        } catch (\Throwable $exception) {
            report($exception);
            if ($request->hasSession()) {
                $request->session()->put('verification_delivery_failed', true);
            }
        }

        return response()->json([
            'success' => true,
            'redirect' => route('verification.notice')
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

    public function apiLogout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['success' => true]);
    }
}
