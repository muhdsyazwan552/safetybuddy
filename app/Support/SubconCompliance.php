<?php

namespace App\Support;

use App\Models\SafetyInductionTopic;
use App\Models\SubconCompany;
use Illuminate\Support\Facades\DB;

/**
 * A subcontractor (executor) company stays ACTIVE only while its leader has
 * acknowledged every active Safety Passport rule of the owner company.
 * Any missing tick makes the company INACTIVE.
 */
class SubconCompliance
{
    /** Active Safety Passport rules of the company that owns this subcontractor. */
    public static function topicsFor(SubconCompany $subcon)
    {
        $owner = (int) $subcon->company_id;

        // the 14 default rules are fixed for every company, even if the owner never opened the settings page
        if ($owner) {
            SafetyInductionDefaults::ensure($owner);
        }

        return SafetyInductionTopic::with('items')
            ->where('company_id', $owner)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    /** @return array{total:int, done:int, complete:bool, acked:array<int,int>} */
    public static function progress(SubconCompany $subcon): array
    {
        $topicIds = self::topicsFor($subcon)->pluck('id')->all();

        $acked = DB::table('subcon_induction_acks')
            ->where('subcon_company_id', $subcon->id)
            ->whereIn('topic_id', $topicIds)
            ->pluck('topic_id')
            ->all();

        return [
            'total' => count($topicIds),
            'done' => count($acked),
            'complete' => count($topicIds) === count($acked),
            'acked' => array_map('intval', $acked),
        ];
    }

    /** Put status in line with the Safety Passport progress. Returns the new progress. */
    public static function sync(SubconCompany $subcon): array
    {
        $progress = self::progress($subcon);
        $target = $progress['complete'] ? 'active' : 'inactive';

        if (strtolower((string) $subcon->status) !== $target) {
            $subcon->forceFill(['status' => $target])->save();
        }

        return $progress;
    }

    /** After the owner edits the induction, re-evaluate all of its subcontractors. */
    public static function syncAllFor(int $ownerCompanyId): void
    {
        SubconCompany::where('company_id', $ownerCompanyId)->get()->each(fn ($s) => self::sync($s));
    }
}
