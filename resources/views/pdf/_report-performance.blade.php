@php
    $pct = fn ($value) => $value === null ? '—' : number_format($value, 2) . '%';
    $share = fn ($count, $total) => $pct($total ? $count / $total * 100 : null);
    $money = fn ($amount) => 'RM ' . number_format($amount, 2);
    $metrics = [
        'sp' => ['(SP) SAFETY PASSPORT', 'From SP Compliance'],
        'g' => ['(G) GOOD', 'From GOOD Breakdown'],
        'p' => ['(P) POOR', '100% - POOR Breakdown'],
        'n' => ['(N) NONCONFORMANCE', '100% - NC Breakdown'],
        'c' => ['(C) CLIENT COMPLAINT', '100% - CC Breakdown'],
    ];
@endphp

<h2>Inspection Summary</h2>
<table class="grid">
    <thead><tr><th style="width:55%">Inspection Category</th><th>Total</th><th>Breakdown</th></tr></thead>
    <tbody>
        @foreach($categoryTotals as $category => $count)
            <tr><td>{{ $category }}</td><td>{{ $count }}</td><td>{{ $share($count, count($inspections)) }}</td></tr>
        @endforeach
    </tbody>
</table>
</div>
@if(!empty($dailyReport))
    @include('pdf._daily-category-chart')
@endif
<table class="grid" style="margin-top:13pt">
    <thead><tr><th style="width:55%">Evaluation</th><th>Total</th><th>Breakdown</th></tr></thead>
    <tbody>
        @foreach($evaluationLabels as $key => $label)
            @php($count = $evaluations->get($key, 0))
            <tr><td>{{ $label }}</td><td>{{ $count }}</td><td>{{ $share($count, $performance['total']) }}</td></tr>
        @endforeach
    </tbody>
</table>

@if(!empty($dailyReport))
    @include('pdf._daily-finding-breakdown')
@endif

<div style="page-break-inside:avoid">
<h2>SPGPNC Performance</h2>
<table class="grid">
    @if(!empty($dailyReport))
        <thead><tr><th style="width:45%">SPGPNC</th><th style="width:18%">Score</th><th>Remarks</th></tr></thead>
    @endif
    @foreach($metrics as $key => [$label, $source])
        <tr><td style="width:45%">{{ $label }}</td><td style="width:18%">{{ $pct($performance[$key]) }}</td><td>{{ $source }}</td></tr>
    @endforeach
    <tr><th class="highlight">SPGPNC Score</th><td class="highlight"><strong>{{ $settings['scoring_on'] ? ($performance['complete'] ? $pct($performance['spgpnc']) : 'Incomplete') : 'Disabled' }}</strong></td><td>Average SPGPNC</td></tr>
</table>
</div>

@if(!empty($dailyReport))
    @include('pdf._daily-performance-chart')
@endif

<h2>BSPR Score</h2>
<table class="grid">
    <thead><tr><th>BSPR</th><th>Your Setting</th><th>Best Safety Practices Rank</th></tr></thead>
    <tbody>
        <tr><td>GOLD</td><td>{{ $pct($settings['gold_min']) }}</td><td rowspan="3" class="center rank highlight">{{ $settings['bspr_on'] && $settings['scoring_on'] ? ($performance['rank'] ?? 'Incomplete') : 'Disabled' }}</td></tr>
        <tr><td>SILVER</td><td>{{ $pct($settings['silver_min']) }}</td></tr>
        <tr><td>BRONZE</td><td>Below Silver</td></tr>
    </tbody>
</table>

<div style="page-break-inside:avoid">
@if($settings['penalties_on'])
    <h2>Penalty Enforcement</h2>
    <table class="grid" style="page-break-inside:avoid">
        <thead><tr><th style="width:33%">SPGPNC</th><th>Your Setting</th><th>Benchmark Setting</th><th>Penalty Enforcement</th></tr></thead>
        <tbody>
            @foreach($metrics as $key => [$label])
                @php($penaltyKey = ['n' => 'nc', 'c' => 'cc'][$key] ?? $key)
                <tr>
                    <td>{{ $label }}</td>
                    <td>{{ $money($settings[$penaltyKey . '_penalty']) }}</td>
                    <td>{{ $key === 'n' ? 'Per NC' : ($key === 'c' ? 'Per CC' : $pct($settings[$key . '_benchmark'])) }}</td>
                    <td>{{ $money($performance['penalty'][$penaltyKey]) }}</td>
                </tr>
            @endforeach
            <tr><th colspan="3" style="text-align:right">Total</th><td><strong>{{ $money($performance['penalty']['total']) }}</strong></td></tr>
        </tbody>
    </table>
    <p class="note">When a Safety Passport, Good or Poor score falls below its benchmark, the system applies the configured penalty. The total also includes a penalty for each recorded nonconformance or client complaint. Penalty Enforcement serves as a reference for the project owner. To hide these amounts, disable Penalty Enforcement in the SPGPNC &amp; BSPR settings.</p>
@endif
</div>
