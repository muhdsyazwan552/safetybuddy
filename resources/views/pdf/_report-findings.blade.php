<h2>Inspection Findings</h2>
@forelse($inspections as $row)
    @php($inspection = $row['i'])
    <table class="grid finding">
        <colgroup><col style="width:29%"><col style="width:35%"><col style="width:36%"></colgroup>
        <tr><th>Reference No</th><td>{{ $inspection->code ?: '—' }}</td><th class="center">PHOTOS</th></tr>
        <tr>
            <th>Inspection Category</th><td>{{ $row['category'] ?? '—' }}</td>
            <td rowspan="5" class="finding-photos{{ count($row['photos']) === 1 ? ' finding-photos-single' : '' }}">
                @forelse($row['photos'] as $photo)
                    <img src="{{ $photo }}" alt="Finding photo">
                @empty
                    —
                @endforelse
            </td>
        </tr>
        <tr><th>Inspection Item</th><td>{{ $inspection->topic?->name ?? '—' }}</td></tr>
        <tr><th>Subcontractor</th><td>{{ $inspection->subconCompany?->name ?? '—' }}</td></tr>
        <tr><th>Location</th><td>{{ $inspection->location ?: '—' }}</td></tr>
        <tr><th>Evaluation</th><td>{{ $evaluationLabels[$inspection->evaluation] ?? strtoupper($inspection->evaluation ?? '—') }}</td></tr>
        <tr><th>Finding Description</th><td colspan="2" class="description">{{ $inspection->description ?: '—' }}</td></tr>
    </table>
@empty
    <p>No inspections recorded.</p>
@endforelse

