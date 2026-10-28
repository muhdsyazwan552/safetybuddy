<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Safety Passport</title>
<style>
    @page { margin: 18mm 16mm 18mm 16mm; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1f2937; line-height: 1.5; }
    h1 { font-size: 18px; margin: 0; color: #111827; }
    .head { width: 100%; border-bottom: 2px solid #0f766e; padding-bottom: 6px; margin-bottom: 10px; }
    .head td { vertical-align: bottom; }
    .co { font-size: 11px; font-weight: bold; color: #0f766e; text-align: right; }
    .small { color: #6b7280; font-size: 8.5px; }
    h2 { font-size: 11.5px; margin: 14px 0 6px; padding: 5px 8px; background: #f0fdfa; border-left: 3px solid #0f766e; color: #115e59; page-break-after: avoid; }
    p { margin: 0 0 6px; }
    .sub { font-weight: bold; margin-top: 8px; color: #111827; }
    .hl { border: 1px solid #99f6e4; background: #f0fdfa; padding: 5px 8px; font-weight: bold; margin-bottom: 6px; }
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
