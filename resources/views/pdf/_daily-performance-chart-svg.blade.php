@php
    $labels = [
        'sp' => ['(SP) SAFETY', 'PASSPORT'],
        'g' => ['(G) GOOD', ''],
        'p' => ['(P) POOR', ''],
        'n' => ['(N)', 'NONCONFORMANCE'],
        'c' => ['(C) CLIENT', 'COMPLAINT'],
    ];
    $plotTop = 42;
    $plotHeight = 112;
    $baseline = $plotTop + $plotHeight;
@endphp
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="197" viewBox="0 0 600 197">
    <rect x="1" y="1" width="598" height="195" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
    <g font-family="DejaVu Sans, sans-serif" fill="#1e293b">
        <text x="300" y="23" text-anchor="middle" font-size="13" font-weight="bold">SPGPNC PERFORMANCE</text>
        @foreach([100, 80, 60, 40, 20, 0] as $tick)
            @php
                $y = $baseline - $tick / 100 * $plotHeight;
            @endphp
            <line x1="49" y1="{{ $y }}" x2="582" y2="{{ $y }}" stroke="#cbd5e1"/>
            <text x="41" y="{{ $y + 3 }}" text-anchor="end" font-size="9">{{ $tick }}%</text>
        @endforeach
        @foreach($labels as $key => [$first, $second])
            @php
                $x = 102 + $loop->index * 106;
                $score = $performance[$key];
                $height = $score === null ? 0 : max(0, min(100, $score)) / 100 * $plotHeight;
                $y = $baseline - $height;
            @endphp
            @if($height > 0)
                <rect x="{{ $x - 17 }}" y="{{ $y }}" width="34" height="{{ $height }}" fill="#eab308"/>
            @endif
            <text x="{{ $x }}" y="{{ $y - 5 }}" text-anchor="middle" font-size="9">{{ $score === null ? 'N/A' : rtrim(rtrim(number_format($score, 2), '0'), '.') . '%' }}</text>
            <text x="{{ $x }}" y="171" text-anchor="middle" font-size="9">{{ $first }}</text>
            @if($second !== '')
                <text x="{{ $x }}" y="184" text-anchor="middle" font-size="9">{{ $second }}</text>
            @endif
        @endforeach
    </g>
</svg>
