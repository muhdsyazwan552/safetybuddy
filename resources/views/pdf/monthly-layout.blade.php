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
    .record-heading { page-break-before: always; font-size: 13px; font-weight: bold; border-bottom: 2px solid #2457d6; padding-bottom: 7px; }
    .chart { page-break-inside: avoid; margin-bottom: 7px; }
    .chart img { width: 100%; height: auto; }
    .summary { margin: 4px 0 6px; border: 1px solid #d7dbe2; border-left: 3px solid #2457d6; background: #f8f9fb; padding: 6px 9px; page-break-inside: avoid; }
    .summary-title { font-size: 7px; font-weight: bold; letter-spacing: 1.2px; text-transform: uppercase; color: #2457d6; margin-bottom: 4px; }
    .summary-stats { table-layout: fixed; margin-bottom: 4px; }
    .summary-stats td { padding: 0 6px 0 0; vertical-align: top; }
    .summary-stats .sl { display: block; font-size: 7px; color: #626975; text-transform: uppercase; }
    .summary-stats .sv { display: block; font-size: 9px; font-weight: bold; color: #171717; }
    .summary-text { margin: 0; font-size: 8.5px; line-height: 1.55; color: #2b3038; }
    .chart h2 { margin-top: 12px; }
    .analytics-page { page-break-before: always; }
    .photos { table-layout: fixed; }
    .photos td { padding: 4px; text-align: center; vertical-align: top; }
    .photos img { max-width: 100%; max-height: 190px; }

    /* cover page */
    .cover { height: 238mm; padding: 14mm 12mm 0; text-align: center; page-break-after: always; }
    .cover .logo { max-width: 62mm; max-height: 48mm; }
    .cover .co-name { margin: 12px 0 0; font-size: 17px; font-weight: bold; }
    .cover .co-fallback { margin: 0 auto; width: 62mm; height: 34mm; border: 2px solid #171717; }
    .cover .co-fallback td { text-align: center; vertical-align: middle; font-size: 30px; font-weight: bold; }
    .cover .doc-title { margin: 30mm 0 0; font-size: 36px; font-weight: bold; line-height: 1.25; text-transform: none; letter-spacing: 0; }
    .cover .doc-sub { margin: 10px 0 0; font-size: 12px; color: #2b3038; line-height: 1.7; }
    .cover .sign-box { width: 112mm; margin: 16mm auto 0; border-collapse: collapse; }
    .cover .sign-box td { border: 1px solid #171717; padding: 6px 8px; font-size: 11px; height: 8mm; }
    .cover .sign-box td.k { width: 38%; text-align: right; }

    /* contents page */
    .contents-title { margin: 0 0 18px; font-size: 20px; text-decoration: underline; text-transform: none; letter-spacing: 0; }
    .contents li { margin: 0 0 10px; font-size: 11px; list-style: none; }
    .contents ul { padding: 0; margin: 0; }
    .contents .desc { display: block; margin: 1px 0 0 14px; font-size: 8px; color: #626975; }
    .sec-title { margin: 0 0 12px; font-size: 20px; text-transform: none; letter-spacing: 0; text-decoration: underline; }
    .stat-grid td { text-align: center; }
    .stat-grid .big { display: block; font-size: 16px; font-weight: bold; }
    .stat-grid .lbl { display: block; font-size: 7px; color: #626975; text-transform: uppercase; }
</style>
</head>
<body>
<header><table><tr>
    <td class="company">{{ $company }}</td>
    <td class="reference">{{ $refNo }}</td>
</tr></table></header>
<footer><table><tr>
    <td style="text-align:center;font-weight:bold">This report is generated from Safety Buddy Application</td>
    <td style="text-align:right;width:60px">Page <span class="pn"></span></td>
</tr></table></footer>
@yield('body')
</body>
</html>
