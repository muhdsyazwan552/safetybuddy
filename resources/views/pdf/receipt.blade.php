<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Receipt {{ $receiptNo }}</title>
    <style>
        @page { margin: 42pt; }
        body { margin: 0; font-family: DejaVu Sans, sans-serif; font-size: 10pt; color: #182235; }
        table { width: 100%; border-collapse: collapse; }
        .header { background: #111827; border-bottom: 4pt solid #f2c94c; }
        .header td { vertical-align: middle; padding: 16pt 20pt; }
        .header .logo { width: 43pt; padding-right: 0; }
        .header img { width: 43pt; }
        .header .brand { padding-left: 12pt; color: #fff; font-size: 16pt; font-weight: bold; }
        .header .reference { text-align: right; color: #f2c94c; font-size: 10pt; font-weight: bold; }
        .summary { margin: 22pt 0 17pt; }
        .summary td { vertical-align: middle; }
        h1 { margin: 0; font-size: 24pt; }
        .stamp-cell { width: 116pt; text-align: center; }
        .stamp { display: inline-block; width: 90pt; padding: 3pt 0 4pt; border: 4pt double #23734e;
            border-radius: 5pt; color: #23734e; font-size: 20pt; font-weight: bold;
            letter-spacing: 3pt; line-height: 1.05; transform: rotate(-8deg); }
        .stamp small { display: block; font-size: 6pt; letter-spacing: 1.2pt; margin-top: 3pt; }
        .meta { margin-bottom: 23pt; background: #f4f6fa; table-layout: fixed; }
        .meta td { width: 50%; vertical-align: top; padding: 13pt 15pt; word-wrap: break-word; }
        .meta td + td { border-left: 1pt solid #e0e5ec; }
        .label { color: #4d5b70; font-size: 8pt; }
        .section-label { font-weight: bold; letter-spacing: .8pt; text-transform: uppercase; }
        .field { margin: 7pt 0 0; }
        .secondary { color: #4d5b70; font-size: 9pt; line-height: 1.55; }
        .items { table-layout: fixed; }
        .items th { background: #182235; color: #fff; padding: 9pt 12pt; text-align: left;
            font-size: 8pt; letter-spacing: .7pt; text-transform: uppercase; }
        .items td { padding: 13pt 12pt; vertical-align: top; word-wrap: break-word; }
        .items .money { width: 110pt; text-align: right; white-space: nowrap; }
        .items .total td { background: #fff5d6; border-top: 1pt solid #ecdcae; font-weight: bold; }
        .items .total .money { font-size: 13pt; }
        .note { margin-top: 23pt; padding-top: 12pt; border-top: 1pt solid #e0e5ec;
            color: #4d5b70; font-size: 8pt; line-height: 1.65; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td class="logo"><img src="{{ $logo }}" alt=""></td>
            <td class="brand">Safety Buddy</td>
            <td class="reference">{{ $receiptNo }}</td>
        </tr>
    </table>

    <table class="summary">
        <tr>
            <td><h1>Payment receipt</h1></td>
            <td class="stamp-cell"><div class="stamp">PAID<small>PAYMENT APPROVED</small></div></td>
        </tr>
    </table>

    <table class="meta">
        <tr>
            <td>
                <div class="label section-label">Received from</div>
                <p class="field"><strong>{{ $company?->name ?? '—' }}</strong></p>
                @if($company?->registration_no)
                    <div class="secondary">Reg. {{ $company->registration_no }}</div>
                @endif
                @if($company?->email)
                    <div class="secondary">{{ $company->email }}</div>
                @endif
            </td>
            <td>
                <div class="label section-label">Order details</div>
                <p class="field"><strong>{{ $orderNo ?? '—' }}</strong></p>
                <div class="secondary">Order placed · {{ $placedAt ?? '—' }}</div>
                <div class="secondary">Payment approved · {{ $paidAt ?? '—' }}</div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead><tr><th>Description</th><th class="money">Amount</th></tr></thead>
        <tbody>
            <tr>
                <td>
                    <strong>{{ $description }}</strong>
                    @if($details)<div class="secondary">{{ $details }}</div>@endif
                    @if($period)<div class="secondary">Period · {{ $period }}</div>@endif
                </td>
                <td class="money">RM {{ number_format($amount, 2) }}</td>
            </tr>
            <tr class="total">
                <td>Total paid</td>
                <td class="money">RM {{ number_format($amount, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <p class="note">Keep this receipt for your records. For payment enquiries, WhatsApp 016-8865619 and quote your order number or receipt number.</p>
</body>
</html>
