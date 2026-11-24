@extends('pdf.inspection-report-layout')
@section('brand')
@if($companyLogo)
    <img class="brand-logo" src="{{ $companyLogo }}" alt="">
@endif
<span class="company-name">{{ $company }}</span>
@endsection
@section('heading', 'DAILY REPORT')
@section('body')
@php
    $pct = fn ($value) => $value === null ? '—' : number_format($value, 2) . '%';
    $benchmarkStatus = ['meets' => 'Meets benchmark', 'below' => 'Below benchmark', 'na' => 'Not assessed'];
@endphp
<h2>Project Details</h2>
<table class="details">
    <tr><th>Project Name</th><td>{{ $r['project'] }}</td></tr>
    <tr><th>Inspection Date</th><td>{{ \Carbon\Carbon::parse($r['date'])->format('d M Y') }}</td></tr>
    <tr><th>Inspector</th><td>{{ $inspectors ?: '—' }}</td></tr>
    <tr><th>Total Inspections</th><td>{{ count($inspections) }}</td></tr>
    <tr><th>Subcontractor</th><td>{{ $r['subcon'] }}</td></tr>
    <tr><th>Report Status</th><td>{{ $r['status'] === 'approved' ? 'Complete' : 'Not complete' }}</td></tr>
</table>

<h2>Toolbox Talk &amp; SP Sampling</h2>
@forelse($talks as $row)
    @php
        $talk = $row['t'];
        $topics = $talk->categories->pluck('name')->merge($talk->topics->pluck('name'))->unique();
    @endphp
    @if(count($talks) > 1)
        <h3 class="talk-label">Toolbox Talk {{ $loop->iteration }} · {{ $talk->code }}</h3>
    @endif
    <table class="details">
        <tr><th>Toolbox Conducted By</th><td>{{ $talk->conducted === 'yes' ? ($talk->CompanyStaff?->name ?? '—') : 'Toolbox Not Conducted' }}</td></tr>
    </table>
    <table class="grid evidence">
        <thead><tr><th class="center">Group Photo</th><th class="center">Attendance Sheet</th></tr></thead>
        <tbody><tr>
            <td>@if($row['imgGroup'])<img src="{{ $row['imgGroup'] }}" alt="Group photo">@else — @endif</td>
            <td>@if($row['imgAttendance'])<img src="{{ $row['imgAttendance'] }}" alt="Attendance sheet">@else — @endif</td>
        </tr></tbody>
    </table>
    <table class="details">
        <tr><th>Topics</th><td>{{ $topics->implode(', ') ?: '—' }}</td></tr>
        @forelse($talk->attendees as $attendee)
            <tr><th>{{ $loop->first ? 'Attendees / SP Sampling' : '' }}</th><td>{{ $attendee->name }}</td></tr>
        @empty
            <tr><th>Attendees / SP Sampling</th><td>{{ $talk->total_attended ?? '—' }}</td></tr>
        @endforelse
    </table>
@empty
    <p>No toolbox talk recorded.</p>
@endforelse
<table class="details" style="margin-top:6pt">
    <tr><th>SP Sampled</th><td>{{ $performance['sampled'] ?? '—' }}</td></tr>
    <tr><th>Not Registered</th><td>{{ $performance['not_registered'] ?? '—' }}</td></tr>
    <tr><th>SP Compliance</th><td>{{ $pct($performance['sp']) }}</td></tr>
    <tr><th>Benchmark Setting</th><td>{{ $pct($settings['sp_benchmark']) }}</td></tr>
    <tr><th>Status</th><td>{{ $benchmarkStatus[$performance['result']['sp']] ?? 'Not assessed' }}</td></tr>
</table>

@include('pdf._report-findings')
@include('pdf._report-performance', ['dailyReport' => true])
@endsection
