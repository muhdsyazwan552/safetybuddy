<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyEmailVerificationController extends Controller
{
    public function notice(Request $request): Response
    {
        return Inertia::render('Auth/VerifyEmail', [
            'email' => $request->session()->get('verification_email', ''),
            'status' => $request->session()->get('status'),
            'deliveryFailed' => (bool) $request->session()->get('verification_delivery_failed'),
        ]);
    }

    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        abort_unless($user->email_verification_required
            && hash_equals(sha1($user->getEmailForVerification()), $hash), 403);

        if (! $user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        $request->session()->forget(['verification_email', 'verification_delivery_failed']);

        return redirect()->route('admin.login')->with('success', 'Email verified. Sign in to choose your package.');
    }

    public function resend(Request $request): RedirectResponse
    {
        $validated = $request->validate(['email' => ['required', 'email']]);
        $email = $validated['email'];
        $request->session()->put('verification_email', $email);
        $request->session()->forget('verification_delivery_failed');

        $user = User::where('email', $email)
            ->where('email_verification_required', true)
            ->whereNull('email_verified_at')
            ->first();

        if ($user) {
            $user->sendEmailVerificationNotification();
        }

        return redirect()->route('verification.notice')->with('status', 'If the account is awaiting verification, a new link has been sent.');
    }
}
