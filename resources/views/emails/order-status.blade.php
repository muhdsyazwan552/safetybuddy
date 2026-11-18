<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ $subjectLine }}</title></head>
<body style="margin:0;padding:24px;background:#f4f4f0;font-family:Arial,Helvetica,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td style="background:#0f172a;padding:20px 28px;color:#facc15;font-size:18px;font-weight:bold;letter-spacing:1px;">SAFETY BUDDY</td></tr>
    <tr><td style="height:4px;background:#facc15;"></td></tr>
    <tr><td style="padding:28px;">
        <p style="margin:0 0 12px;font-size:16px;">Hi {{ $name }},</p>
        <p style="margin:0 0 14px;"><span style="display:inline-block;padding:5px 12px;border-radius:12px;font-size:12px;font-weight:bold;background:{{ $tone === 'danger' ? '#ffe4e6' : '#d1fae5' }};color:{{ $tone === 'danger' ? '#9f1239' : '#065f46' }};">{{ $heading }}</span></p>
        <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#374151;">{!! nl2br(e($bodyText)) !!}</p>
        @if(count($details))
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:22px;">
            @foreach($details as $label => $value)
            <tr><td style="padding:10px 18px;font-size:12px;color:#6b7280;width:40%;">{{ $label }}</td><td style="padding:10px 18px;font-size:14px;font-weight:bold;">{{ $value }}</td></tr>
            @endforeach
        </table>
        @endif
        @if($receiptNo)<p style="margin:0 0 20px;font-size:13px;color:#374151;">Your receipt <strong>{{ $receiptNo }}</strong> is attached to this email as a PDF.</p>@endif
        @if($actionUrl)<p style="margin:0 0 20px;"><a href="{{ $actionUrl }}" style="display:inline-block;background:#facc15;color:#111827;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;">{{ $actionLabel }}</a></p>@endif
        <p style="margin:0;font-size:12px;color:#6b7280;">Questions? WhatsApp us at 016-8865619 and quote your order number.</p>
    </td></tr>
</table>
</body></html>
