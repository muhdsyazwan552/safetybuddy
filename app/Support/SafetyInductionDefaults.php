<?php

namespace App\Support;

use App\Models\SafetyInductionItem;
use App\Models\SafetyInductionTopic;
use Illuminate\Support\Facades\DB;

/**
 * Default Safety Passport Rules from the Safety Passport Rules Mechanism document.
 * Block types: p = paragraph, h = sub-heading, b = bullet, hl = highlighted message.
 */
class SafetyInductionDefaults
{
    private const MAP = ['p' => 'paragraph', 'h' => 'subheading', 'b' => 'bullet', 'hl' => 'highlight'];

    public static function topics(): array
    {
        return [
            1 => ['title' => 'Safety Passport Rules Briefing', 'blocks' => [
                ['p', "Each registered worker must receive, understand and comply with the Company's Safety Passport Rules before starting work. The subcontractor must brief all workers, obtain their signed acknowledgements, and submit the Worker Acknowledgement Register and briefing photos through the Contractor Portal for approval by the Main Contractor's 1st Tier (Manager). Only workers with approved briefing records will receive \"SP Rules Briefing Done\" status."],
            ]],
            2 => ['title' => 'Introduction', 'blocks' => [
                ['p', "All contractors, subcontractors, workers and visitors must comply with the Company's Safety Passport requirements and site safety rules to prevent accidents, injuries and property damage. Applicable registration, safety briefing and authorisation requirements must be completed before commencing site activities. Golden Rule: No job is so important that it cannot be done safely."],
            ]],
            3 => ['title' => 'Safety Policy', 'blocks' => [
                ['p', 'All personnel must follow established safety procedures, comply with instructions from supervisors and safety officers, immediately report unsafe conditions and stop work when conditions are unsafe. Non-compliance may result in removal from site.'],
            ]],
            4 => ['title' => 'Roles & Responsibilities', 'blocks' => [
                ['p', 'Workers must perform their duties safely, use appropriate PPE and report hazards or incidents. Supervisors must ensure safe working conditions, conduct required safety briefings and monitor compliance. Contractors must provide adequate training, supervision and PPE while ensuring their workers comply with project safety requirements.'],
            ]],
            5 => ['title' => 'Personal Protective Equipment (PPE)', 'blocks' => [
                ['p', 'All personnel must wear the required PPE, including safety helmets, safety footwear and reflective safety vests where applicable, together with gloves, eye protection and other protective equipment based on work hazards. Damaged PPE must be replaced immediately. No Required PPE = No Site Entry.'],
            ]],
            6 => ['title' => 'Site Safety Rules', 'blocks' => [
                ['p', 'All personnel must obtain permission before entering restricted areas, comply with safety signs and instructions, maintain good housekeeping and refrain from alcohol, drugs, fighting or other misconduct that may compromise workplace safety.'],
            ]],
            7 => ['title' => 'Hazard Awareness', 'blocks' => [
                ['p', 'All personnel must remain alert to workplace hazards, including slips, trips, falls, working at height, electrical hazards, moving machinery, vehicles, sharp equipment and chemical exposure. Unsafe activities must be stopped and reported immediately.'],
            ]],
            8 => ['title' => 'Emergency Procedures', 'blocks' => [
                ['p', 'During an emergency, all personnel must stop work, notify their supervisor or safety officer, follow emergency instructions, evacuate calmly to the designated assembly point and only return when authorized.'],
            ]],
            9 => ['title' => 'Fire Safety', 'blocks' => [
                ['p', 'In the event of fire, personnel must raise the alarm, follow designated evacuation routes and proceed to the assembly point. Fire extinguishers may only be used by trained personnel when it is safe to do so.'],
            ]],
            10 => ['title' => 'Incident & Near Miss Reporting', 'blocks' => [
                ['p', 'All injuries, incidents, near misses, property damage and unsafe conditions must be reported immediately to the supervisor or safety officer to enable appropriate investigation, corrective action and prevention of recurrence.'],
            ]],
            11 => ['title' => 'Housekeeping', 'blocks' => [
                ['p', 'All personnel must maintain clean and safe work areas, store tools and equipment properly, dispose of waste appropriately and keep walkways and emergency access routes clear at all times. A Clean Site = A Safe Site.'],
            ]],
            12 => ['title' => 'Safety Compliance', 'blocks' => [
                ['p', 'All personnel must comply with applicable safety rules, procedures and instructions. Violations may result in warnings, work suspension, removal from site or other appropriate action in accordance with company requirements and applicable laws.'],
            ]],
            13 => ['title' => 'Contractor Responsibility', 'blocks' => [
                ['p', 'Contractors must ensure all workers are properly registered under the project workforce, informed of the Safety Passport requirements, provided with necessary training and supervision, and required to acknowledge and comply with applicable safety rules before commencing work.'],
            ]],
            14 => ['title' => 'Final Message', 'blocks' => [
                ['p', "Safety is everyone's responsibility. Work Safe. Go Home Safe."],
            ]],
        ];
    }

    /** Create one topic (and its blocks) from the default definition. */
    public static function createTopic(int $companyId, int $key, int $sortOrder): SafetyInductionTopic
    {
        $def = self::topics()[$key];

        $topic = SafetyInductionTopic::create([
            'company_id' => $companyId,
            'default_key' => $key,
            'title' => $def['title'],
            'sort_order' => $sortOrder,
            'is_active' => true,
            'is_customised' => false,
        ]);

        self::fillItems($topic, $def['blocks']);

        return $topic;
    }

    /** Write the given [type, content] blocks as the topic's items. */
    public static function fillItems(SafetyInductionTopic $topic, array $blocks): void
    {
        foreach ($blocks as $i => [$type, $content]) {
            SafetyInductionItem::create([
                'topic_id' => $topic->id,
                'sort_order' => $i,
                'type' => self::MAP[$type],
                'content' => $content,
            ]);
        }
    }

    /**
     * The 14 defaults are fixed for every company: create any that are missing and put back
     * any that were edited or hidden. Custom topics are never touched.
     *
     * @return bool true when something changed (contractors then have to re-tick)
     */
    public static function ensure(int $companyId): bool
    {
        $changed = false;

        DB::transaction(function () use ($companyId, &$changed) {
            $existing = SafetyInductionTopic::where('company_id', $companyId)->whereNotNull('default_key')->get()->keyBy('default_key');

            foreach (array_keys(self::topics()) as $i => $key) {
                $def = self::topics()[$key];
                $topic = $existing->get($key);

                if (!$topic) {
                    self::createTopic($companyId, $key, $i + 1);
                    $changed = true;
                } elseif ($topic->is_customised || !$topic->is_active || $topic->title !== $def['title'] || (int) $topic->sort_order !== $i + 1) {
                    $topic->update(['title' => $def['title'], 'sort_order' => $i + 1, 'is_active' => true, 'is_customised' => false]);
                    $topic->items()->delete();
                    self::fillItems($topic, $def['blocks']);
                    $changed = true;
                }
            }
        });

        return $changed;
    }

    /** First visit: give the company the 14 Safety Passport Rules. */
    public static function seedFor(int $companyId): void
    {
        DB::transaction(function () use ($companyId) {
            foreach (array_keys(self::topics()) as $i => $key) {
                self::createTopic($companyId, $key, $i + 1);
            }
        });
    }
}
