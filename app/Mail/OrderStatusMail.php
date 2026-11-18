<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Facades\Mail;

/** One status email for every approval / rejection / payment confirmation; a payment confirmation carries the receipt PDF. */
class OrderStatusMail extends Mailable
{
    public function __construct(
        public string $subjectLine,
        public string $name,
        public string $heading,
        public string $bodyText,
        public string $tone = 'success', // success | danger
        public array $details = [],
        public ?string $receiptNo = null,
        public ?string $receiptPdf = null,
        public ?string $actionUrl = null,
        public ?string $actionLabel = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-status');
    }

    public function attachments(): array
    {
        return $this->receiptPdf ? [Attachment::fromData(fn () => $this->receiptPdf, $this->receiptNo.'.pdf')->withMime('application/pdf')] : [];
    }

    /** Send without ever failing the approval itself if the mail server is down. */
    public static function deliver(?string $email, self $mail): void
    {
        if (! $email) {
            return;
        }
        try {
            Mail::to($email)->send($mail);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
