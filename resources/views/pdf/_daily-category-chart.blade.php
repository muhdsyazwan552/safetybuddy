<div class="category-chart">
    <h3>Inspection Category Breakdown</h3>
    <table aria-label="Inspection category breakdown">
        <tbody>
            @foreach($categoryTotals as $category => $count)
                @php($percentage = count($inspections) ? 100 * $count / count($inspections) : 0)
                <tr>
                    <th scope="row">{{ $category }}</th>
                    <td class="category-bar-cell">
                        @if($percentage > 0)
                            <div class="category-bar" style="width:{{ $percentage }}%"></div>
                        @endif
                    </td>
                    <td class="category-value">{{ $count > 0 ? $share($count, count($inspections)) : '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
