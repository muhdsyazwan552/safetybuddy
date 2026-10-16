<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            // every page embeds this in its HTML (data-page), so only send what the UI reads
            'auth' => [
                'user' => fn () => $this->authUser($request->user()),
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'warning' => fn() => $request->session()->get('warning'),
                'info' => fn() => $request->session()->get('info'),
            ],
        ];
    }

    private function authUser($user): ?array
    {
        if (!$user) {
            return null;
        }

        $user->loadMissing('company:id,name', 'role:id,name,display_name');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'company_id' => $user->company_id,
            'role_id' => $user->role_id,
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
            'company' => $user->company ? ['id' => $user->company->id, 'name' => $user->company->name] : null,
            'role' => $user->role ? ['id' => $user->role->id, 'name' => $user->role->name, 'display_name' => $user->role->display_name] : null,
        ];
    }
}
