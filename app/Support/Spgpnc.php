<?php

namespace App\Support;

/**
 * SPGPNC score, BSPR rank and penalties - one place for the daily report, the monthly report
 * and every screen, so the numbers always agree.
 *
 *   SP = compliant sampled workers / sampled workers x 100
 *   G  = GOOD / findings x 100
 *   P  = 100 - POOR / findings x 100
 *   N  = 100 - NC   / findings x 100
 *   C  = 100 - CC   / findings x 100
 *   SPGPNC = (SP + G + P + N + C) / 5          (needs all five)
 *
 * Unrounded values are used throughout; rounding is for display only.
 */
class Spgpnc
{
    public const DEFAULTS = [
        'sp_benchmark' => 100.0, 'g_benchmark' => 80.0, 'p_benchmark' => 80.0,
        'sp_penalty' => 300.0, 'g_penalty' => 300.0, 'p_penalty' => 300.0, 'nc_penalty' => 100.0, 'cc_penalty' => 500.0,
        'gold_min' => 90.0, 'silver_min' => 60.0,
        'scoring_on' => true, 'bspr_on' => true, 'penalties_on' => true,
    ];

    /**
     * @param  int|null  $sampled        workers sampled for the Safety Passport (null = not assessed)
     * @param  int|null  $notRegistered  workers without a valid Safety Passport
     * @param  array     $counts         ['good','poor','nc','cc']
     * @param  array     $settings       see DEFAULTS
     */
    public static function score(?int $sampled, ?int $notRegistered, array $counts, array $settings = []): array
    {
        $s = $settings + self::DEFAULTS;
        $good = (int) ($counts['good'] ?? 0);
        $poor = (int) ($counts['poor'] ?? 0);
        $nc = (int) ($counts['nc'] ?? 0);
        $cc = (int) ($counts['cc'] ?? 0);
        $total = $good + $poor + $nc + $cc;

        $sp = null;
        $compliant = null;
        if ($sampled !== null && $sampled > 0) {
            $compliant = max(0, $sampled - (int) $notRegistered);
            $sp = $compliant / $sampled * 100;
        }

        $g = $p = $n = $c = null;
        if ($total > 0) {
            $g = $good / $total * 100;
            $p = 100 - ($poor / $total * 100);
            $n = 100 - ($nc / $total * 100);
            $c = 100 - ($cc / $total * 100);
        }

        $complete = $sp !== null && $total > 0;
        $spgpnc = $complete ? ($sp + $g + $p + $n + $c) / 5 : null;

        $rank = null;
        if ($spgpnc !== null && $s['bspr_on']) {
            $rank = $spgpnc >= $s['gold_min'] ? 'GOLD' : ($spgpnc >= $s['silver_min'] ? 'SILVER' : 'BRONZE');
        }

        $below = fn ($score, $bench) => $score !== null && $score < $bench;
        $result = [
            'sp' => $sp === null ? 'na' : ($below($sp, $s['sp_benchmark']) ? 'below' : 'meets'),
            'g' => $g === null ? 'na' : ($below($g, $s['g_benchmark']) ? 'below' : 'meets'),
            'p' => $p === null ? 'na' : ($below($p, $s['p_benchmark']) ? 'below' : 'meets'),
        ];

        $on = (bool) $s['penalties_on'];
        $pen = [
            'sp' => $on && $result['sp'] === 'below' ? (float) $s['sp_penalty'] : 0.0,
            'g' => $on && $result['g'] === 'below' ? (float) $s['g_penalty'] : 0.0,
            'p' => $on && $result['p'] === 'below' ? (float) $s['p_penalty'] : 0.0,
            'nc' => $on ? $nc * (float) $s['nc_penalty'] : 0.0,
            'cc' => $on ? $cc * (float) $s['cc_penalty'] : 0.0,
        ];
        $pen['total'] = array_sum($pen);

        return [
            'sampled' => $sampled, 'not_registered' => $notRegistered, 'compliant' => $compliant,
            'good' => $good, 'poor' => $poor, 'nc' => $nc, 'cc' => $cc, 'total' => $total,
            'sp' => $sp, 'g' => $g, 'p' => $p, 'n' => $n, 'c' => $c,
            'spgpnc' => $spgpnc, 'rank' => $rank, 'complete' => $complete,
            'result' => $result, 'penalty' => $pen,
        ];
    }

    /** Pooled monthly score from the summed counts of the approved daily reports. */
    public static function pooled(array $sums, array $settings = []): array
    {
        return self::score(
            $sums['sp_observations'] > 0 ? (int) $sums['sp_observations'] : null,
            $sums['sp_observations'] > 0 ? (int) $sums['sp_observations'] - (int) $sums['sp_compliant'] : null,
            ['good' => $sums['good'], 'poor' => $sums['poor'], 'nc' => $sums['nc'], 'cc' => $sums['cc']],
            $settings
        );
    }
}
