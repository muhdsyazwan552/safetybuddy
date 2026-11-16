<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Sent once when a company admin registers an employee: how to sign in to Safety Buddy. */
class StaffAccountCreated extends Mailable
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public string $roleName,
        public string $companyName,
        public string $loginUrl,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Safety Buddy login details');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.staff-account-created');
    }
}
