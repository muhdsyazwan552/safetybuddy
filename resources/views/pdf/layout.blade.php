<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>{{ $docTitle }} {{ $refNo }}</title>
<style>
    @page { margin: 28mm 16mm 22mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1f2937; line-height: 1.45; }
    header { position: fixed; top: -22mm; left: 0; right: 0; border-bottom: 2px solid #0f766e; padding-bottom: 5px; }
    header table { width: 100%; }
    .co { font-size: 13px; font-weight: bold; color: #0f766e; }
    .doc { font-size: 9px; color: #6b7280; text-align: right; }
    footer { position: fixed; bottom: -16mm; left: 0; right: 0; font-size: 8px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 4px; }
    footer table { width: 100%; }
    .pn:after { content: counter(page) " / " counter(pages); }
    h1 { font-size: 18px; margin: 0 0 2px; color: #111827; }
    h2 { font-size: 11px; margin: 16px 0 6px; padding: 4px 8px; background: #f0fdfa; border-left: 3px solid #0f766e; color: #115e59; text-transform: uppercase; letter-spacing: .5px; }
    .sub { color: #6b7280; margin-bottom: 8px; }
    table.kv { width: 100%; border-collapse: collapse; }
    table.kv td { padding: 4px 6px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    table.kv td.k { width: 28%; color: #6b7280; }
    table.kv td.v { font-weight: bold; }
    table.grid { width: 100%; border-collapse: collapse; margin-top: 2px; }
    table.grid th { background: #f3f4f6; text-align: left; padding: 5px 6px; border: 1px solid #e5e7eb; font-size: 9px; }
    table.grid td { padding: 5px 6px; border: 1px solid #e5e7eb; vertical-align: top; }
    table.grid td.n, table.grid th.n { text-align: right; }
    .box { border: 1px solid #e5e7eb; padding: 7px 9px; background: #fafafa; white-space: pre-wrap; }
    .badge { display: inline-block; padding: 1px 7px; border-radius: 8px; font-size: 9px; font-weight: bold; background: #e5e7eb; color: #374151; }
    .b-good, .b-approved, .b-closed, .b-GOLD { background: #d1fae5; color: #065f46; }
    .b-poor, .b-open, .b-BRONZE { background: #fef3c7; color: #92400e; }
    .b-nonconformance, .b-clientcomplaint, .b-rejected { background: #fee2e2; color: #991b1b; }
    .b-verified, .b-SILVER { background: #e0e7ff; color: #3730a3; }
    .photos td { padding: 3px; text-align: center; vertical-align: top; }
    .photos img { max-width: 100%; max-height: 190px; border: 1px solid #e5e7eb; }
    .sign { margin-top: 26px; page-break-inside: avoid; }
    .sign table { width: 100%; border-collapse: separate; border-spacing: 8px 0; }
    .sign td { width: 33.3%; vertical-align: top; border: 1px solid #d1d5db; padding: 8px 10px 8px; }
    .sign .role { font-size: 8px; text-transform: uppercase; letter-spacing: .6px; color: #6b7280; }
    .sign .line { height: 42px; border-bottom: 1px solid #111827; margin-bottom: 4px; }
    .sign .nm { font-weight: bold; min-height: 12px; }
    .sign .dt { color: #6b7280; font-size: 8px; }
    .muted { color: #9ca3af; }
</style>
</head>
<body>
<header>
    <table><tr>
        <td class="co">{{ $company }}</td>
        <td class="doc">{{ $docTitle }}<br>Ref: {{ $refNo }}</td>
    </tr></table>
</header>
<footer>
    <table><tr>
        <td>Created by {{ $createdBy }}@if($createdRole) ({{ $createdRole }})@endif &middot; {{ $createdAt }}</td>
        <td style="text-align:right">Page <span class="pn"></span></td>
    </tr></table>
</footer>

<h1>{{ $docTitle }}</h1>
<div class="sub">Ref: {{ $refNo }}</div>

@yield('body')

<div class="sign">
    <table>
        <tr>
            <td>
                <div class="role">Created by</div>
                <div class="line"></div>
                <div class="nm">{{ $createdBy }}</div>
                <div class="dt">{{ $createdRole }}<br>{{ $createdAt }}</div>
            </td>
            <td>
                <div class="role">Supervisor (Tier 2)</div>
                <div class="line"></div>
                <div class="nm">{{ $supervisor['name'] }}</div>
                <div class="dt">Date: {{ $supervisor['at'] }}</div>
            </td>
            <td>
                <div class="role">Manager (Tier 3)</div>
                <div class="line"></div>
                <div class="nm">{{ $manager['name'] }}</div>
                <div class="dt">Date: {{ $manager['at'] }}</div>
            </td>
        </tr>
    </table>
</div>
</body>
</html>
