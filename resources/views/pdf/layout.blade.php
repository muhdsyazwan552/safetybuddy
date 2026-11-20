<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>{{ $docTitle }} {{ $refNo }}</title>
<style>
    @page { margin: 24mm 15mm 20mm; }
    * { box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #171717; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; }
    header { position: fixed; top: -17mm; left: 0; right: 0; border-bottom: 1px solid #171717; padding-bottom: 7px; }
    header .company { font-size: 14px; font-weight: bold; }
    header .reference { text-align: right; color: #2457d6; font-size: 10px; font-weight: bold; }
    footer { position: fixed; bottom: -13mm; left: 0; right: 0; border-top: 1px solid #bfc4cd; padding-top: 5px; font-size: 7px; color: #626975; }
    .pn:after { content: counter(page); }
    .eyebrow { margin: 0 0 3px; font-size: 8px; letter-spacing: 1.4px; color: #626975; text-transform: uppercase; }
    h1 { margin: 0 0 14px; font-size: 23px; line-height: 1.2; letter-spacing: -.5px; text-transform: uppercase; }
    h2 { margin: 16px 0 7px; border-bottom: 1px solid #171717; padding: 0 0 5px; font-size: 10px; text-transform: uppercase; page-break-after: avoid; }
    h2:before { content: ""; display: inline-block; width: 6px; height: 6px; background: #2457d6; margin-right: 7px; }
    .overview { table-layout: fixed; }
    .overview td { padding: 6px 5px; border-top: 1px solid #d7dbe2; vertical-align: top; overflow-wrap: break-word; }
    .overview .label { width: 16%; font-size: 8px; font-weight: bold; }
    .overview td:not(.label) { width: 34%; }
    .overview td:nth-child(3) { border-left: 1px solid #d7dbe2; padding-left: 12px; }
    table.grid { margin-top: 2px; table-layout: fixed; }
    table.grid th, table.grid td { border: 1px solid #b7bdc7; padding: 6px; vertical-align: top; overflow-wrap: break-word; }
    table.grid th { background: #f4f5f7; font-size: 8px; text-align: left; font-weight: bold; }
    table.grid td { font-size: 9px; }
    table.grid td.n, table.grid th.n { text-align: right; }
    .attendees th:first-child, .attendees td:first-child { text-align: center; }
    table.kv td { padding: 5px 6px; border-bottom: 1px solid #e4e6ea; vertical-align: top; }
    table.kv .k { width: 27%; color: #626975; }
    table.kv .v { font-weight: bold; }
    tr { page-break-inside: avoid; }
    .box { border-left: 2px solid #b7bdc7; padding: 6px 10px; white-space: pre-wrap; overflow-wrap: break-word; }
    .muted { color: #626975; font-size: 8px; }
    .sign { margin-top: 24px; page-break-inside: avoid; }
    .sign table { border-collapse: separate; border-spacing: 12px 0; }
    .sign td { width: 33.33%; vertical-align: top; }
    .sign .line { height: 23px; border-bottom: 1px solid #171717; margin-bottom: 5px; }
    .sign .role { font-size: 8px; font-weight: bold; }
    .sign .nm { font-size: 8px; margin-top: 3px; }
    .sign .dt { color: #626975; font-size: 7px; }
    .part { margin: 14px 0 4px; font-size: 13px; font-weight: bold; border-bottom: 2px solid #2457d6; padding-bottom: 7px; }
    .record-heading { page-break-before: always; font-size: 13px; font-weight: bold; border-bottom: 2px solid #2457d6; padding-bottom: 7px; }
    .photos { table-layout: fixed; }
    .photos td { padding: 4px; text-align: center; vertical-align: top; }
    .photos img { max-width: 100%; max-height: 190px; }
</style>
</head>
<body>
<header><table><tr>
    <td class="company">@if(!empty($companyLogo))<img src="{{ $companyLogo }}" alt="" style="height:9mm;vertical-align:middle;margin-right:8px">@endif<span style="vertical-align:middle">{{ $company }}</span></td>
    <td class="reference">{{ $refNo }}</td>
</tr></table></header>
<footer><table><tr>
    <td style="text-align:right">Page <span class="pn"></span></td>
</tr></table></footer>
<p class="eyebrow">Safety performance / Report</p>
<h1>{{ $docTitle }}</h1>
@yield('body')
</body>
</html>
