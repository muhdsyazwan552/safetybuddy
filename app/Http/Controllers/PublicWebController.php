<?php

namespace App\Http\Controllers;

use App\Models\DemoRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PublicWebController extends Controller
{
    /**
     * Landing page "Get your free demo" form.
     */
    public function requestDemo(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'company' => ['nullable', 'string', 'max:255'],
            'projects' => ['nullable', 'string', 'max:40'],
            'preferred_date' => ['nullable', 'date', 'after_or_equal:today'],
            'interests' => ['nullable', 'array'],
            'interests.*' => ['string', 'max:60'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        // Always keep a log line so a request is never lost, even before the migration is run.
        Log::info('Demo request', $data);

        if (Schema::hasTable('demo_requests')) {
            DemoRequest::create($data);
        }

        return back()->with('success', 'Thank you! We received your request and will contact you within one working day.');
    }
}
