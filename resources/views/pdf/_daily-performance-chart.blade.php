@php
    $chartSvg = view('pdf._daily-performance-chart-svg', ['performance' => $performance])->render();
@endphp
<div class="chart">
    <img style="display:block;width:100%" src="data:image/svg+xml;base64,{{ base64_encode($chartSvg) }}" alt="SPGPNC performance column chart">
</div>
