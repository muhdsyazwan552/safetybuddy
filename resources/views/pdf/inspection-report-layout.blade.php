<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{{ $docTitle }} {{ $refNo }}</title>
<style>
    @page { margin: 15mm 14mm 30mm; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 9pt; color: #1e293b; }
    .report-header { background: #171b24; color: #fff; border-bottom: 3pt solid #facc15; margin: -15mm -14mm 0; padding: 15pt 14mm; }
    .report-header .brand-logo { max-width: 22pt; max-height: 20pt; padding: 2pt; margin-right: 6pt; background: #fff; vertical-align: middle; }
    h1 { font-size: 13pt; margin: 2pt 0 0; }
    h2 { font-size: 10.5pt; margin: 22pt 0 9pt; padding-left: 7pt; border-left: 3pt solid #eab308; page-break-after: avoid; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    td, th { padding: 3pt 7pt; vertical-align: top; overflow-wrap: break-word; }
    th { text-align: left; }
    .ref { margin: 0; font-size: 8pt; font-weight: bold; color: #fde047; }
    .details th { width: 29%; font-weight: normal; color: #475569; }
    .details tr:nth-child(odd) { background: #f8fafc; }
    .grid td, .grid th { border: .5pt solid #cbd5e1; }
    .grid thead th { background: #222936; color: #fde047; border-color: #4b5563; border-bottom: 1pt solid #eab308; }
    .grid tbody tr:nth-child(even), .finding th { background: #f1f5f9; }
    .finding tr:first-child th, .finding tr:first-child td { background: #222936; color: #fde047; }
    .finding { page-break-inside: avoid; margin-bottom: 13pt; }
    .category-summary { page-break-inside: avoid; }
    .grid .finding-photos { padding: 4pt; text-align: center; vertical-align: middle; }
    .finding-photos img { max-width: 46%; max-height: 70pt; margin: 1pt; vertical-align: middle; }
    .finding-photos-single img { max-width: 100%; max-height: 128pt; margin: 0; }
    .evidence { margin: 6pt 0; text-align: center; }
    .evidence img { max-width: 100%; max-height: 105pt; }
    .center { text-align: center; }
    .description { white-space: pre-wrap; }
    .note { font-size: 8pt; color: #475569; }
    .grid .highlight { background: #fef3c7; color: #422006; }
    .rank { font-size: 15pt; font-weight: bold; vertical-align: middle; }
    tr { page-break-inside: avoid; }
    .chart { page-break-inside: avoid; margin-top: 10pt; }
    .category-chart { page-break-inside: avoid; margin-top: 13pt; padding: 7pt; border: .5pt solid #cbd5e1; }
    .category-chart h3 { margin: 0 0 5pt; font-size: 9pt; text-align: center; }
    .category-chart th { width: 40%; font-size: 8pt; font-weight: normal; text-align: right; }
    .category-chart td, .category-chart th { padding: 2pt 5pt; vertical-align: middle; }
    .category-chart .category-bar-cell { border-left: .5pt solid #cbd5e1; }
    .category-bar { height: 8pt; background: #eab308; }
    .category-value { width: 12%; font-size: 8pt; text-align: right; }
    .talk-label { margin: 10pt 0 4pt; color: #475569; font-size: 9pt; }

</style>
</head>
<body>
<header class="report-header">
    <p class="ref">@yield('brand') &nbsp; | &nbsp; {{ $refNo }}</p>
    <h1>@yield('heading')</h1>
</header>
@yield('body')
</body>
</html>
