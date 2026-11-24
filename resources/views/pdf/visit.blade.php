@extends('pdf.inspection-report-layout')
@section('brand')
<span class="company-name">{{ $company }}</span>
@endsection
@section('heading', 'TOOLBOX TALK, SP SAMPLING & INSPECTION REPORT')
@section('body')
@php
    $pct = fn ($value) => $value === null ? '—' : number_format($value, 2) . '%';
    $topics = $t ? $t->categories->pluck('name')->merge($t->topics->pluck('name'))->unique() : collect();
@endphp
<h2>Status</h2>
<table class="details">
    <tr><th>Supervisor Approval</th><td>{{ $supervisorApproved ? 'Approved' : 'Pending' }}</td></tr>
    <tr><th>Manager Approval</th><td>{{ $managerApproved ? 'Approved' : 'Pending' }}</td></tr>
    @if($overallStatus === 'rejected')
        <tr><th>Visit Status</th><td>Rejected</td></tr>
    @endif
</table>

<h2>Project Details</h2>
<table class="details">
    <tr><th>Project Name</th><td>{{ $project ?: '—' }}</td></tr>
    <tr><th>Inspection Date</th><td>{{ $date ?: '—' }}</td></tr>
    <tr><th>Inspector</th><td>{{ $by ?: '—' }}</td></tr>
    <tr><th>Total Inspections</th><td>{{ count($inspections) }}</td></tr>
</table>

<h2>Toolbox Talk &amp; SP Sampling</h2>
<table class="details">
    <tr><th>Toolbox Conducted By</th><td>{{ $t?->conducted === 'yes' ? ($by ?: '—') : ($t ? 'Toolbox Not Conducted' : 'No toolbox talk recorded') }}</td></tr>
</table>
@if($t)
    <table class="grid evidence">
        <thead><tr><th class="center">Group Photo</th><th class="center">Attendance Sheet</th></tr></thead>
        <tbody><tr>
            <td>@if($imgGroup)<img src="{{ $imgGroup }}" alt="Group photo">@else — @endif</td>
            <td>@if($imgAttendance)<img src="{{ $imgAttendance }}" alt="Attendance sheet">@else — @endif</td>
        </tr></tbody>
    </table>
@endif
<table class="details">
    <tr><th>Topics</th><td>{{ $topics->implode(', ') ?: '—' }}</td></tr>
    @forelse($t?->attendees ?? [] as $attendee)
        <tr><th>{{ $loop->first ? 'Attendees / SP Sampling' : '' }}</th><td>{{ $attendee->name }}</td></tr>
    @empty
        <tr><th>Attendees / SP Sampling</th><td>{{ $t?->total_attended ?? '—' }}</td></tr>
    @endforelse
    <tr><th>SP Sampled</th><td>{{ $performance['sampled'] ?? '—' }}</td></tr>
    <tr><th>Not Registered</th><td>{{ $performance['not_registered'] ?? '—' }}</td></tr>
    <tr><th>SP Compliance</th><td>{{ $pct($performance['sp']) }}</td></tr>
</table>

@include('pdf._report-findings')
@include('pdf._report-performance')
@endsection
