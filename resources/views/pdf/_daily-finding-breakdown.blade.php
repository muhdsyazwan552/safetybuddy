@php
    $findingGroups = collect($inspections)->groupBy(fn ($row) => $row['i']->evaluation)
        ->map(fn ($rows) => $rows->map(fn ($row) => $row['i']->topic?->name ?? '—')->values());
    $findingHeadings = ['good' => 'GOOD Finding', 'poor' => 'POOR Finding', 'nonconformance' => 'NONCONFORMANCE', 'clientcomplaint' => 'CLIENT COMPLAINT'];
@endphp
<table class="grid" style="margin-top:13pt">
    <thead><tr>@foreach($findingHeadings as $heading)<th>{{ $heading }}</th>@endforeach</tr></thead>
    <tbody>
        @for($index = 0, $rows = max(1, $findingGroups->map->count()->max()); $index < $rows; $index++)
            <tr>
                @foreach($findingHeadings as $key => $heading)
                    <td>{{ $findingGroups->get($key)?->get($index) ?? ($index === 0 ? '—' : '') }}</td>
                @endforeach
            </tr>
        @endfor
    </tbody>
</table>
