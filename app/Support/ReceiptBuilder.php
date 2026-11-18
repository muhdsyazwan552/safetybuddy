<?php

namespace App\Support;

use App\Models\Payments;
use App\Models\PackageActivationCode;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionPlanRequest;
use Barryvdh\DomPDF\Facade\Pdf;

/** Builds the PDF receipt of an approved payment (used by the download link and the payment email). */
class ReceiptBuilder
{
    public static function receiptNo(Payments $payment): string
    {
        return 'RC-'.str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT);
    }

    public static function pdf(Payments $payment, ?string $orderNo = null, ?string $description = null): \Barryvdh\DomPDF\PDF
    {
        $payment->loadMissing(['company', 'subscription.plan:id,name', 'subscription.module:id,name']);
        $addon = SubscriptionAddon::where('payment_id', $payment->id)->first();
        $orderNo ??= $payment->order_no ?? $addon?->order_no ?? ($payment->subscription_id
            ? SubscriptionPlanRequest::where('company_id', $payment->company_id)->where('subscription_id', $payment->subscription_id)->value('order_no')
            : null);
        $details = null;
        if ($description === null) {
            if ($addon) {
                $role = $addon->type === 'executor' ? 'Contractor' : 'Inspector';
                $description = "Extra {$role} capacity";
                $details = $addon->quantity.' '.($addon->quantity === 1 ? 'slot' : 'slots');
            } elseif ($payment->payment_type === 'activation_code_order') {
                $description = 'Training package';
                $count = $orderNo ? PackageActivationCode::where('batch_ref', $orderNo)->count() : 0;
                $details = $count ? $count.' activation '.($count === 1 ? 'code' : 'codes') : 'Activation codes';
            } else {
                $description = $payment->subscription?->plan?->name ?? $payment->subscription?->module?->name ?? 'Package payment';
                $details = 'Annual membership';
            }
        }

        return Pdf::loadView('pdf.receipt', [
            'receiptNo' => self::receiptNo($payment),
            'orderNo' => $orderNo,
            'company' => $payment->company,
            'description' => $description,
            'details' => $details,
            'logo' => 'data:image/png;base64,'.base64_encode(file_get_contents(public_path('images/sbc-logo.png'))),
            'period' => $addon || ! $payment->subscription ? null : ($payment->subscription->start_date?->format('d M Y').' – '.$payment->subscription->end_date?->format('d M Y')),
            'amount' => (float) $payment->total_amount,
            'paidAt' => ($payment->updated_at ?? $payment->created_at)?->format('d M Y, g:i a'),
            'placedAt' => $payment->created_at?->format('d M Y, g:i a'),
        ])->setPaper('a4', 'portrait');
    }
}
