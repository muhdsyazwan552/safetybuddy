<?php
namespace App\Support;

use App\Models\Inspection;
use App\Models\InspectionReport;
use App\Models\MonthlyReport;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/** Local SVG charts: no remote chart service or client-side JavaScript in PDFs. */
class MonthlyReportCharts
{
    private static function text($x, $y, $text, $anchor = 'start'): string
    {
        return '<text x="'.$x.'" y="'.$y.'" text-anchor="'.$anchor.'" font-family="DejaVu Sans" font-size="11" fill="#525b69">'.htmlspecialchars((string) $text, ENT_QUOTES | ENT_XML1, 'UTF-8').'</text>';
    }

    public static function chart(array $labels, array $series, string $kind, float $max = 0, string $prefix = '', string $xTitle = '', string $yTitle = ''): string
    {
        $h = in_array($kind, ['line', 'stacked'], true) ? 250 : ($kind === 'bullet' ? 92 + count($labels) * 34 : 225);
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="'.$h.'" viewBox="0 0 720 '.$h.'">';
        $values = array_merge(...array_map(fn ($s) => $s['values'], $series));
        if (!count(array_filter($values, fn ($v) => $v !== null))) {
            $svg .= self::text(360, 110, 'No assessed data available', 'middle');
        } elseif ($kind === 'bullet') {
            // one row per subcontractor: its score against the Bronze / Silver / Gold bands
            $meta = $series[0]['meta'];
            $x0 = 230; $w = 370; $px = fn ($v) => $x0 + $w * max(0, min(100, $v)) / 100;
            $bands = [[0, $meta['silver'], '#f1d6d3', 'Bronze'], [$meta['silver'], $meta['gold'], '#dfe4ec', 'Silver'], [$meta['gold'], 100, '#f5e6b3', 'Gold']];
            foreach ($bands as [$from, $to, $fill, $name]) {
                $svg .= self::text(($px($from) + $px($to)) / 2, 14, $name, 'middle');
            }
            foreach ($labels as $i => $label) {
                $y = 26 + $i * 34;
                foreach ($bands as [$from, $to, $fill]) {
                    $svg .= '<rect x="'.$px($from).'" y="'.$y.'" width="'.($px($to) - $px($from)).'" height="22" fill="'.$fill.'"/>';
                }
                $svg .= self::text(220, $y + 15, mb_strimwidth($label, 0, 26, '...'), 'end');
                $v = $series[0]['values'][$i];
                if ($v === null) { $svg .= self::text($x0 + 8, $y + 15, 'Awaiting approval'); continue; }
                $color = ($meta['self'] === $i) ? '#2457d6' : '#6b778a';
                $svg .= '<rect x="'.$x0.'" y="'.($y + 5).'" width="'.($px($v) - $x0).'" height="12" fill="'.$color.'"/>'
                    .self::text($x0 + $w + 10, $y + 15, round($v, 1).'% '.$meta['ranks'][$i]);
            }
            $axisY = 26 + count($labels) * 34;
            foreach ([0, $meta['silver'], $meta['gold'], 100] as $t) {
                $svg .= '<line x1="'.$px($t).'" x2="'.$px($t).'" y1="22" y2="'.($axisY - 8).'" stroke="#9aa3b2" stroke-dasharray="2,2"/>'.self::text($px($t), $axisY + 6, round($t), 'middle');
            }
            $svg .= self::text($x0 + $w / 2, $axisY + 24, 'Monthly SPGPNC score (%)', 'middle');
        } elseif ($kind === 'pie') {
            $total = array_sum($values);
            $colors = ['#2457d6', '#16835d', '#d89b1c', '#8056b8', '#d44444', '#0891b2', '#c76a25', '#64748b'];
            $angle = -M_PI / 2;
            foreach ($labels as $i => $label) {
                $v = $values[$i];
                if ($v <= 0 || $total <= 0) continue;
                $next = $angle + 2 * M_PI * $v / $total;
                $color = $colors[$i % count($colors)];
                if ($v == $total) {
                    $svg .= '<circle cx="170" cy="110" r="92" fill="'.$color.'"/>';
                } else {
                    // polygon fan: the SVG arc command is drawn wrongly for slices over 180 degrees
                    $pts = '170,110';
                    $steps = max(2, (int) ceil(($next - $angle) / (M_PI / 60)));
                    for ($k = 0; $k <= $steps; $k++) {
                        $t = $angle + ($next - $angle) * $k / $steps;
                        $pts .= ' '.round(170 + 92 * cos($t), 2).','.round(110 + 92 * sin($t), 2);
                    }
                    $svg .= '<polygon points="'.$pts.'" fill="'.$color.'" stroke="white" stroke-width="1"/>';
                }
                $y = 23 + $i * 24;
                $svg .= '<rect x="300" y="'.($y-9).'" width="9" height="9" fill="'.$color.'"/>'.self::text(318, $y, mb_strimwidth($label, 0, 35, '...')).self::text(700, $y, $v.' ('.round($v / $total * 100, 1).'%)', 'end');
                $angle = $next;
            }
        } elseif ($kind === 'horizontal') {
            $max = $max ?: max(1, ...$values);
            foreach ($labels as $i => $label) {
                $y = 16 + $i * 23;
                $svg .= self::text(205, $y + 11, mb_strimwidth($label, 0, 29, '...'), 'end');
                $v = $series[0]['values'][$i];
                if ($v === null) { $svg .= self::text(220, $y + 11, 'Not assessed'); continue; }
                $svg .= '<rect x="220" y="'.$y.'" width="'.(420 * $v / $max).'" height="14" fill="#2457d6"/>'.self::text(650, $y + 11, round($v, 2));
            }
        } else {
            $max = $max ?: max(1, ...array_map(fn ($i) => array_sum(array_column(array_map(fn ($s) => ['v' => $s['values'][$i] ?? 0], $series), 'v')), array_keys($labels)));
            $max = max(4, ceil($max / 4) * 4);
            for ($i = 0; $i <= 4; $i++) {
                $y = 170 - $i * 37;
                $svg .= '<line x1="50" x2="700" y1="'.$y.'" y2="'.$y.'" stroke="#e1e5eb"/>'.self::text(43, $y + 4, round($max * $i / 4, 1), 'end');
            }
            $n = count($labels);
            $xOf = fn ($i) => 60 + ($i + .5) * 625 / max(1, $n);
            $hasData = fn ($i) => count(array_filter($series, fn ($s) => ($s['values'][$i] ?? null) !== null)) > 0;
            foreach ($labels as $i => $label) {
                $x = $xOf($i);
                if ($n <= 8 || $i % 5 === 4 || $i === 0 || $i === $n - 1 || ($kind === 'line' && $hasData($i))) {
                    $svg .= self::text($x, 190, $label, 'middle');
                }
            }
            if ($kind === 'line') {
                foreach ($series as $s) {
                    $prev = null;
                    foreach ($labels as $i => $label) {
                        $v = $s['values'][$i] ?? null;
                        if ($v === null) continue;
                        $x = $xOf($i); $y = 170 - $v / $max * 148;
                        // assessed days are joined even when days in between were not assessed
                        if ($prev) $svg .= '<line x1="'.$prev[0].'" y1="'.$prev[1].'" x2="'.$x.'" y2="'.$y.'" stroke="'.$s['color'].'" stroke-width="2"/>';
                        $prev = [$x, $y];
                    }
                    foreach ($labels as $i => $label) {
                        $v = $s['values'][$i] ?? null;
                        if ($v === null) continue;
                        $x = $xOf($i); $y = 170 - $v / $max * 148;
                        $svg .= '<circle cx="'.$x.'" cy="'.$y.'" r="3.5" fill="'.$s['color'].'"/>'.self::text($x, max(12, $y - 8), $prefix.round($v, 1), 'middle');
                    }
                }
            } else {
                foreach ($labels as $i => $label) {
                    $x = $xOf($i); $bottom = 170; $sum = 0; $any = false;
                    foreach ($series as $s) {
                        $v = $s['values'][$i] ?? null;
                        if ($v === null) continue;
                        $any = true; $sum += $v;
                        $height = $v / $max * 148; $bottom -= $height;
                        if ($height > 0) $svg .= '<rect x="'.($x-16).'" y="'.$bottom.'" width="32" height="'.$height.'" fill="'.$s['color'].'"/>';
                    }
                    if ($any) $svg .= self::text($x, max(12, $bottom - 5), $prefix.round($sum, 1), 'middle');
                }
            }
            if ($xTitle !== '') $svg .= self::text(375, 212, $xTitle, 'middle');
            if ($yTitle !== '') $svg .= '<text transform="rotate(-90 11 96)" x="11" y="96" text-anchor="middle" font-family="DejaVu Sans" font-size="11" fill="#525b69">'.htmlspecialchars($yTitle, ENT_QUOTES | ENT_XML1, 'UTF-8').'</text>';
            foreach ($series as $i => $s) $svg .= '<rect x="'.(50 + $i * 155).'" y="231" width="7" height="7" fill="'.$s['color'].'"/>'.self::text(62 + $i * 155, 239, $s['name']);
        }
        return 'data:image/svg+xml;base64,'.base64_encode($svg.'</svg>');
    }

    private static function pct($v): string
    {
        return number_format((float) $v, 2).'%';
    }

    /** Build the professional summary shown under each chart: key figures plus a short narrative. */
    private static function summary(array $stats, string $text): array
    {
        return ['stats' => $stats, 'text' => $text];
    }

    public static function forReport(MonthlyReport $m): array
    {
        $start = Carbon::parse($m->period.'-01');
        $days = InspectionReport::where('company_id', $m->company_id)->where('project_id', $m->project_id)->where('subcon_company_id', $m->subcon_company_id)->where('status', 'approved')->whereBetween('report_date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()])->get();
        $byDate = $days->keyBy(fn ($d) => $d->report_date->day);
        $labels = range(1, $start->daysInMonth);
        $series = fn ($name, $values, $color = '#2457d6') => ['name' => $name, 'values' => $values, 'color' => $color];
        $charts = [];
        $charts[] = ['title' => 'Daily safety score', 'note' => 'SPGPNC score (%) on each assessed date. Only assessed dates are shown; they are joined by a line.', 'image' => (function () use ($byDate, $start, $series) {
                // only the dates that were assessed are shown on the horizontal axis
                $d = $byDate->filter(fn ($r) => $r->spgpnc !== null)->sortKeys();
                return self::chart($d->keys()->map(fn ($day) => $day.'/'.$start->month)->all(), [$series('SPGPNC score (%)', $d->map(fn ($r) => (float) $r->spgpnc)->values()->all())], 'line', 100, '', 'Date (day/month)', 'SPGPNC score (%)');
            })(),
            'summary' => (function () use ($days, $start) {
                $rows = $days->filter(fn ($d) => $d->spgpnc !== null)->sortBy('report_date')->values();
                $dm = fn ($d) => $d->report_date->format('j M');
                if ($rows->isEmpty()) return self::summary([['Days assessed', '0 of '.$start->daysInMonth]], 'No daily safety score was assessed for this subcontractor during the month, so no trend can be reported.');
                $hi = $rows->sortByDesc('spgpnc')->first(); $lo = $rows->sortBy('spgpnc')->first();
                $avg = $rows->avg('spgpnc'); $first = $rows->first(); $last = $rows->last();
                $ranks = $rows->groupBy(fn ($d) => strtoupper($d->rank ?: 'N/A'))->map->count();
                $delta = $last->spgpnc - $first->spgpnc;
                $text = 'The subcontractor was assessed on '.$rows->count().' of '.$start->daysInMonth.' days, with an average daily SPGPNC score of '.self::pct($avg).'. The highest score was '.self::pct($hi->spgpnc).' on '.$dm($hi).' and the lowest was '.self::pct($lo->spgpnc).' on '.$dm($lo).'.';
                if ($rows->count() > 1) $text .= ' From the first assessed day ('.$dm($first).') to the last ('.$dm($last).') the score '.($delta > 0 ? 'improved by ' : ($delta < 0 ? 'declined by ' : 'was unchanged at ')).($delta == 0 ? self::pct($last->spgpnc) : number_format(abs($delta), 2).' percentage points').'.';
                return self::summary([
                    ['Days assessed', $rows->count().' of '.$start->daysInMonth],
                    ['Average score', self::pct($avg)],
                    ['Highest', self::pct($hi->spgpnc).' ('.$dm($hi).')'],
                    ['Lowest', self::pct($lo->spgpnc).' ('.$dm($lo).')'],
                    ['Rank days', $ranks->map(fn ($c, $k) => $k.' '.$c)->implode(' / ')],
                ], $text);
            })()];
        $weeks = range(0, (int) floor(($start->daysInMonth - 1) / 7));
        $weekLabels = array_map(fn ($w) => ($w*7+1).'-'.min($start->daysInMonth, $w*7+7), $weeks);
        $groups = $days->groupBy(fn ($d) => (int) floor(($d->report_date->day - 1)/7));
        $findings = [];
        foreach (['good' => '#16835d', 'poor' => '#d89b1c', 'nc' => '#d44444', 'cc' => '#8056b8'] as $key => $color) $findings[] = $series(strtoupper($key), array_map(fn ($w) => isset($groups[$w]) ? $groups[$w]->sum($key) : null, $weeks), $color);
        $charts[] = ['title' => 'Weekly findings', 'note' => 'Finding counts. Week labels show calendar-day ranges.', 'image' => self::chart($weekLabels, $findings, 'stacked', 0, '', 'Week (days of the month)', 'Findings (count)'),
            'summary' => (function () use ($days, $groups, $weeks, $weekLabels) {
                $tot = ['good' => (int) $days->sum('good'), 'poor' => (int) $days->sum('poor'), 'nc' => (int) $days->sum('nc'), 'cc' => (int) $days->sum('cc')];
                $all = array_sum($tot);
                if ($all === 0) return self::summary([['Total findings', '0']], 'No findings were recorded in approved daily reports for this subcontractor during the month.');
                $perWeek = array_map(fn ($w) => isset($groups[$w]) ? (int) ($groups[$w]->sum('good') + $groups[$w]->sum('poor') + $groups[$w]->sum('nc') + $groups[$w]->sum('cc')) : 0, $weeks);
                $peak = array_search(max($perWeek), $perWeek, true);
                $text = 'A total of '.$all.' findings were recorded: '.$tot['good'].' good, '.$tot['poor'].' poor, '.$tot['nc'].' non-conformance and '.$tot['cc'].' client complaint. Good findings represent '.number_format($tot['good'] / $all * 100, 1).'% of the total. The busiest period was days '.$weekLabels[$peak].' with '.$perWeek[$peak].' findings.';
                if ($tot['nc'] + $tot['cc'] > 0) $text .= ' Non-conformances and complaints require corrective-action follow-up.';
                return self::summary([
                    ['Total findings', (string) $all], ['Good', $tot['good'].' ('.number_format($tot['good'] / $all * 100, 1).'%)'],
                    ['Poor', (string) $tot['poor']], ['NC / CC', $tot['nc'].' / '.$tot['cc']], ['Peak period', 'Days '.$weekLabels[$peak]],
                ], $text);
            })()];
        $peers = MonthlyReport::with('subcontractor')->where('company_id', $m->company_id)->where('project_id', $m->project_id)->where('period', $m->period)->orderByDesc('spgpnc')->get();
        // every subcontractor of the project against the rank bands; unranked ones are marked as awaiting approval
        $snap = is_array($m->settings_snapshot) ? $m->settings_snapshot : [];
        $gold = (float) ($snap['gold_min'] ?? 90); $silver = (float) ($snap['silver_min'] ?? 60);
        $rows = $peers->filter(fn ($p) => $p->subcontractor)->values()->take(8);
        $isRanked = fn ($p) => $p->spgpnc !== null && $p->rank;
        $selfIdx = $rows->search(fn ($p) => (int) $p->subcon_company_id === (int) $m->subcon_company_id);
        $charts[] = ['title' => 'Subcontractor score against rank bands', 'note' => 'Monthly SPGPNC score of each subcontractor on this project, shown against the Bronze, Silver and Gold bands. The report subcontractor is highlighted in blue; a subcontractor whose monthly report is not yet approved is shown as awaiting approval.',
            'image' => self::chart($rows->map(fn ($p) => $p->subcontractor->name)->all(), [array_merge($series('Score', $rows->map(fn ($p) => $isRanked($p) ? (float) $p->spgpnc : null)->all()), ['meta' => ['gold' => $gold, 'silver' => $silver, 'self' => $selfIdx === false ? -1 : $selfIdx, 'ranks' => $rows->map(fn ($p) => $isRanked($p) ? strtoupper($p->rank) : '')->all()]])], 'bullet'),
            'summary' => (function () use ($peers, $isRanked, $m, $gold, $silver) {
                $ranked = $peers->filter($isRanked); $awaiting = $peers->count() - $ranked->count();
                $own = $peers->first(fn ($p) => (int) $p->subcon_company_id === (int) $m->subcon_company_id);
                if (!$own || !$isRanked($own)) return self::summary([['This subcontractor', 'Not ranked'], ['Awaiting approval', (string) $awaiting]], 'The monthly score of this subcontractor has not been approved yet, so it cannot be compared with the rank bands.');
                $score = (float) $own->spgpnc; $rank = strtoupper($own->rank);
                $gap = $score >= $gold ? null : $gold - $score;
                $avg = $ranked->avg('spgpnc'); $pos = $ranked->sortByDesc('spgpnc')->values()->search(fn ($p) => $p->id === $own->id) + 1;
                $text = 'This subcontractor scored '.self::pct($score).' for the month and holds the '.$rank.' rank (Silver from '.rtrim(rtrim(number_format($silver, 2), '0'), '.').'%, Gold from '.rtrim(rtrim(number_format($gold, 2), '0'), '.').'%). '
                    .($gap === null ? 'The Gold standard has been achieved.' : 'A further '.number_format($gap, 2).' percentage points are needed to reach Gold.')
                    .($ranked->count() > 1 ? ' It is placed '.$pos.' of '.$ranked->count().' ranked subcontractors against a project average of '.self::pct($avg).'.' : '')
                    .($awaiting > 0 ? ' '.$awaiting.' other subcontractor'.($awaiting === 1 ? ' is' : 's are').' awaiting monthly approval and not yet comparable.' : '');
                return self::summary([
                    ['Monthly score', self::pct($score)], ['Rank', $rank],
                    ['To reach Gold', $gap === null ? 'Achieved' : '+'.number_format($gap, 2).' pts'],
                    ['Project average', $ranked->count() > 1 ? self::pct($avg) : 'Single ranked'], ['Awaiting approval', (string) $awaiting],
                ], $text);
            })()];
        $inspections = Inspection::with('topic')->where('company_id', $m->company_id)->where('project_id', $m->project_id)->where('subcon_company_id', $m->subcon_company_id)->where('status', Inspection::STATUS_APPROVED)->whereIn(DB::raw('DATE(inspection_date)'), $days->map(fn ($d) => $d->report_date->toDateString())->all())->get();
        $categories = DB::table('inspection_categories')->pluck('name', 'id');
        $counts = $inspections->groupBy(fn ($i) => $categories[$i->topic?->inspection_category_id] ?? 'Uncategorised')->map->count()->sortDesc();
        if ($counts->count() > 8) {
            $other = $counts->slice(7)->sum();
            $counts = $counts->take(7)->put('Other categories', $other);
        }
        $charts[] = ['title' => 'Findings by inspection category', 'note' => 'Approved inspections in the selected scope; count and share of all categories. Smaller categories grouped as Other when needed.', 'image' => self::chart($counts->keys()->all(), [$series('Findings', $counts->values()->all())], 'pie'),
            'summary' => (function () use ($counts) {
                $all = (int) $counts->sum();
                if ($all === 0) return self::summary([['Inspections analysed', '0']], 'No approved inspections are available for this subcontractor in the month.');
                $topName = $counts->keys()->first(); $topN = (int) $counts->first();
                $text = $all.' approved inspections across '.$counts->count().' categor'.($counts->count() === 1 ? 'y' : 'ies').' were analysed. '.$topName.' accounts for '.$topN.' ('.number_format($topN / $all * 100, 1).'%) of inspections, making it the main focus area for the period.';
                return self::summary([
                    ['Inspections analysed', (string) $all], ['Categories', (string) $counts->count()],
                    ['Largest category', $topName], ['Share of total', number_format($topN / $all * 100, 1).'%'],
                ], $text);
            })()];
        $charts[] = ['title' => 'Weekly penalty totals', 'note' => 'Sum of recorded daily penalties; calendar-day ranges on the horizontal axis.', 'image' => self::chart($weekLabels, [$series('Penalty amount (RM)', array_map(fn ($w) => isset($groups[$w]) ? $groups[$w]->sum('penalty_total') : null, $weeks))], 'stacked', 0, 'RM', 'Week (days of the month)', 'Penalty (RM)'),
            'summary' => (function () use ($groups, $weeks, $weekLabels, $days) {
                $per = array_map(fn ($w) => isset($groups[$w]) ? (float) $groups[$w]->sum('penalty_total') : 0.0, $weeks);
                $total = array_sum($per);
                $weeksHit = count(array_filter($per, fn ($v) => $v > 0));
                if ($total <= 0) return self::summary([['Total penalty', 'RM 0.00']], 'No penalties were recorded in approved daily reports during the month.');
                $peak = array_search(max($per), $per, true);
                $daysHit = $days->filter(fn ($d) => (float) $d->penalty_total > 0)->count();
                $text = 'Penalties totalling RM '.number_format($total, 2).' were recorded across '.$daysHit.' day'.($daysHit === 1 ? '' : 's').' in '.$weeksHit.' of '.count($weeks).' weeks. The highest weekly total was RM '.number_format(max($per), 2).' (days '.$weekLabels[$peak].'), representing '.number_format(max($per) / $total * 100, 1).'% of the month.';
                return self::summary([
                    ['Total penalty', 'RM '.number_format($total, 2)], ['Days with penalty', (string) $daysHit],
                    ['Highest week', 'RM '.number_format(max($per), 2)], ['Peak period', 'Days '.$weekLabels[$peak]],
                ], $text);
            })()];
        $spDays = $days->filter(fn ($r) => $r->sp_sampled > 0 && $r->sp_not_registered !== null);
        $charts[] = ['title' => 'Safety Passport compliance', 'note' => 'Compliant / sampled workers (%) by day. Only sampled dates are shown; they are joined by a line.', 'image' => (function () use ($byDate, $start, $series) {
                $d = $byDate->filter(fn ($r) => $r->sp_sampled > 0 && $r->sp_not_registered !== null)->sortKeys();
                return self::chart($d->keys()->map(fn ($day) => $day.'/'.$start->month)->all(), [$series('Compliance (%)', $d->map(fn ($r) => max(0, $r->sp_sampled - $r->sp_not_registered) / $r->sp_sampled * 100)->values()->all())], 'line', 100, '', 'Date (day/month)', 'Compliance (%)');
            })(),
            'summary' => (function () use ($spDays, $start) {
                if ($spDays->isEmpty()) return self::summary([['Days sampled', '0 of '.$start->daysInMonth]], 'No Safety Passport sampling was recorded for this subcontractor during the month.');
                $sampled = (int) $spDays->sum('sp_sampled'); $notReg = (int) $spDays->sum('sp_not_registered');
                $compliant = max(0, $sampled - $notReg); $overall = $compliant / $sampled * 100;
                $rate = fn ($r) => max(0, $r->sp_sampled - $r->sp_not_registered) / $r->sp_sampled * 100;
                $low = $spDays->sortBy($rate)->first(); $below = $spDays->filter(fn ($r) => $rate($r) < 100)->count();
                $text = 'Safety Passport sampling was carried out on '.$spDays->count().' of '.$start->daysInMonth.' days, covering '.$sampled.' worker checks. '.$compliant.' were compliant and '.$notReg.' were not registered, giving an overall compliance rate of '.self::pct($overall).'. '.($below === 0 ? 'Every sampled day achieved full compliance.' : $below.' day'.($below === 1 ? '' : 's').' fell below 100%; the lowest was '.self::pct($rate($low)).' on '.$low->report_date->format('j M').'.');
                return self::summary([
                    ['Days sampled', $spDays->count().' of '.$start->daysInMonth], ['Workers sampled', (string) $sampled],
                    ['Not registered', (string) $notReg], ['Overall compliance', self::pct($overall)],
                    ['Days below 100%', (string) $below],
                ], $text);
            })()];
        return $charts;
    }
}
