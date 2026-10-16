<?php

namespace App\Support;

use App\Models\SafetyInductionItem;
use App\Models\SafetyInductionTopic;
use Illuminate\Support\Facades\DB;

/**
 * Default safety induction content.
 * Source: SafetyBuddy Master System Document v1.2 - Appendix B "Contractor safety declarations"
 * (12 declarations, preserved verbatim). Block types: p = paragraph, h = sub-heading, b = bullet,
 * hl = highlighted message.
 */
class SafetyInductionDefaults
{
    private const MAP = ['p' => 'paragraph', 'h' => 'subheading', 'b' => 'bullet', 'hl' => 'highlight'];

    public static function topics(): array
    {
        return [
            1 => ['title' => 'Declaration 1', 'blocks' => [
                ['p', 'I confirm that I have read and understood the Basic Safety Induction Content provided in the Safety Passport System.'],
            ]],
            2 => ['title' => 'Declaration 2', 'blocks' => [
                ['p', 'I will ensure the Safety Induction Content is communicated and briefed to all workers under my supervision.'],
            ]],
            3 => ['title' => 'Declaration 3', 'blocks' => [
                ['p', 'I will ensure all workers are informed of emergency procedures, including evacuation routes and assembly points.'],
            ]],
            4 => ['title' => 'Declaration 4', 'blocks' => [
                ['p', 'I will ensure all workers are aware of PPE requirements and will enforce correct PPE usage at all times.'],
            ]],
            5 => ['title' => 'Declaration 5', 'blocks' => [
                ['p', 'I will ensure all workers are informed of hazard reporting procedures and will encourage immediate reporting of unsafe conditions.'],
            ]],
            6 => ['title' => 'Declaration 6', 'blocks' => [
                ['p', 'I will ensure all workers understand that they have the authority to stop work if it is unsafe.'],
            ]],
            7 => ['title' => 'Declaration 7', 'blocks' => [
                ['p', 'I will ensure toolbox briefings or equivalent safety briefings are conducted regularly at site.'],
            ]],
            8 => ['title' => 'Declaration 8', 'blocks' => [
                ['p', 'I will ensure all subcontractors and third parties under my control comply with site safety requirements.'],
            ]],
            9 => ['title' => 'Declaration 9', 'blocks' => [
                ['p', 'I will ensure all safety-related communications and updates from the Safety Passport System are distributed to relevant workers.'],
            ]],
            10 => ['title' => 'Declaration 10', 'blocks' => [
                ['p', 'I understand that failure to comply with safety requirements may result in access restriction, suspension, or termination of work activities.'],
            ]],
            11 => ['title' => 'Declaration 11', 'blocks' => [
                ['p', 'I acknowledge that this declaration forms part of the official digital safety compliance record within the system.'],
            ]],
            12 => ['title' => 'Declaration 12', 'blocks' => [
                ['p', 'I confirm that all information declared is accurate, complete and made in good faith.'],
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

    /** First visit: give the company the full default set (the 12 declarations). */
    public static function seedFor(int $companyId): void
    {
        DB::transaction(function () use ($companyId) {
            foreach (array_keys(self::topics()) as $i => $key) {
                self::createTopic($companyId, $key, $i + 1);
            }
        });
    }
}
