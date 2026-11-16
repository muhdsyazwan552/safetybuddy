<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your Safety Buddy login details</title>
</head>
<body style="margin:0;padding:24px;background:#f4f4f0;font-family:Arial,Helvetica,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td style="background:#0f172a;padding:20px 28px;color:#facc15;font-size:18px;font-weight:bold;letter-spacing:1px;">SAFETY BUDDY</td></tr>
    <tr><td style="height:4px;background:#facc15;"></td></tr>
    <tr><td style="padding:28px;">
        <p style="margin:0 0 12px;font-size:16px;">Hi {{ $name }},</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#374151;">
            {{ $companyName ?: 'Your company' }} has registered you as <strong>{{ $roleName }}</strong> in Safety Buddy. Use the details below to sign in.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:14px 18px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Login email</td></tr>
            <tr><td style="padding:0 18px 14px;font-size:15px;font-weight:bold;">{{ $email }}</td></tr>
            <tr><td style="padding:0 18px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Password</td></tr>
            <tr><td style="padding:0 18px 14px;font-size:15px;font-weight:bold;">{{ $password }}</td></tr>
        </table>

        <p style="margin:0 0 10px;font-size:14px;font-weight:bold;">How to sign in</p>
        <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:24px;color:#374151;">
            <li>Open the Safety Buddy login page: <a href="{{ $loginUrl }}" style="color:#a16207;">{{ $loginUrl }}</a></li>
            <li>Enter your login email shown above.</li>
            <li>Enter your password shown above (it is your phone number).</li>
            <li>Tap <strong>Sign in</strong>. You will go straight to your dashboard.</li>
            <li>After your first sign in, open your <strong>Profile</strong> and change your password.</li>
        </ol>

        <p style="margin:0 0 24px;text-align:center;">
            <a href="{{ $loginUrl }}" style="display:inline-block;background:#facc15;color:#111827;font-weight:bold;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:999px;">Sign in to Safety Buddy</a>
        </p>

        <p style="margin:0;font-size:12px;line-height:18px;color:#6b7280;">
            Keep these details private. If you did not expect this email, contact your company admin.
        </p>
    </td></tr>
</table>
</body>
</html>
