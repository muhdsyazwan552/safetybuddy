<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Safety Passport</title>
<style>
    @page { margin: 18mm 16mm 18mm 16mm; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1f2937; line-height: 1.5; }
    h1 { font-size: 18px; margin: 0; color: #111827; }
    .head { width: 100%; border-bottom: 1px solid #171717; padding-bottom: 6px; margin-bottom: 10px; }
    .head td { vertical-align: bottom; }
    .co { font-size: 11px; font-weight: bold; color: #2457d6; text-align: right; }
    .small { color: #6b7280; font-size: 8.5px; }
    h2 { margin: 16px 0 7px; border-bottom: 1px solid #171717; padding: 0 0 5px; font-size: 10px; text-transform: uppercase; page-break-after: avoid; }
    h2:before { content: ""; display: inline-block; width: 6px; height: 6px; background: #2457d6; margin-right: 7px; }
    p { margin: 0 0 6px; }
    .sub { font-weight: bold; margin-top: 8px; color: #111827; }
    .hl { border: 1px solid #b7bdc7; background: #f4f5f7; padding: 5px 8px; font-weight: bold; margin-bottom: 6px; }
    ul { margin: 0 0 6px; padding-left: 16px; }
    li { margin-bottom: 2px; }
    .topic { page-break-inside: auto; }
</style>
</head>
<body>
<table class="head"><tr>
    <td><h1>Safety Passport</h1>
        <div class="small">Reference copy &middot; {{ count($topics) }} topics &middot; generated {{ $generatedAt }}</div></td>
    <td class="co">{{ $company->name }}@if($company->code)<br><span class="small">{{ $company->code }}</span>@endif</td>
</tr></table>

@forelse($topics as $n => $t)
    <div class="topic">
        <h2>{{ $n + 1 }}. {{ $t->title }}</h2>
        @php $bullets = []; @endphp
        @foreach($t->items as $it)
            @if($it->type === 'bullet')
                @php $bullets[] = $it->content; @endphp
            @else
                @if($bullets)<ul>@foreach($bullets as $b)<li>{{ $b }}</li>@endforeach</ul>@php $bullets = []; @endphp @endif
                @if($it->type === 'subheading')<p class="sub">{{ $it->content }}</p>
                @elseif($it->type === 'highlight')<p class="hl">{{ $it->content }}</p>
                @else<p>{{ $it->content }}</p>@endif
            @endif
        @endforeach
        @if($bullets)<ul>@foreach($bullets as $b)<li>{{ $b }}</li>@endforeach</ul>@endif
    </div>
@empty
    <p class="small">No Safety Passport topics set up.</p>
@endforelse
</body>
</html>
