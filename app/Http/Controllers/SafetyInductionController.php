<?php

namespace App\Http\Controllers;

use App\Models\SafetyInductionItem;
use App\Models\SafetyInductionTopic;
use App\Support\SafetyInductionDefaults;
use App\Support\SubconCompliance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Performance Settings > Safety Induction (Safety Passport Rules).
 * The Manager starts from the 12 default declarations of Appendix B and can edit,
 * add, reorder, hide or reset any of them.
 */
class SafetyInductionController extends Controller
{
    private function companyId(): int
    {
        return (int) Auth::user()->company_id;
    }

    private function ownTopic(int $id): SafetyInductionTopic
    {
        return SafetyInductionTopic::where('company_id', $this->companyId())->findOrFail($id);
    }

    /** Subcontractors must re-tick when the induction content changes. */
    private function resync(): void
    {
        SubconCompliance::syncAllFor($this->companyId());
    }

    public function index(): Response
    {
        $companyId = $this->companyId();

        // first visit → copy the default declarations for this company
        if (!SafetyInductionTopic::where('company_id', $companyId)->exists()) {
            SafetyInductionDefaults::seedFor($companyId);
        }

        $topics = SafetyInductionTopic::with('items')
            ->where('company_id', $companyId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'default_key' => $t->default_key,
                'title' => $t->title,
                'is_active' => $t->is_active,
                'is_customised' => $t->is_customised,
                'items' => $t->items->map(fn ($i) => [
                    'type' => $i->type,
                    'content' => $i->content,
                ])->values(),
            ])->values();

        // default topics that were deleted and can be restored
        $present = $topics->pluck('default_key')->filter()->all();
        $missing = collect(SafetyInductionDefaults::topics())
            ->reject(fn ($d, $key) => in_array($key, $present, true))
            ->map(fn ($d, $key) => ['key' => $key, 'title' => $d['title']])
            ->values();

        return Inertia::render('WSIS/Safety_Induction', [
            'title' => 'Safety Induction',
            'topics' => $topics,
            'missingDefaults' => $missing,
            'defaultCount' => count(SafetyInductionDefaults::topics()),
        ]);
    }

    private function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'items' => ['required', 'array', 'min:1', 'max:150'],
            'items.*.type' => ['required', Rule::in(SafetyInductionItem::TYPES)],
            'items.*.content' => ['required', 'string', 'max:2000'],
        ];
    }

    private function writeItems(SafetyInductionTopic $topic, array $items): void
    {
        $topic->items()->delete();
        foreach (array_values($items) as $i => $item) {
            SafetyInductionItem::create([
                'topic_id' => $topic->id,
                'sort_order' => $i,
                'type' => $item['type'],
                'content' => trim($item['content']),
            ]);
        }
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate($this->rules());

        DB::transaction(function () use ($data) {
            $topic = SafetyInductionTopic::create([
                'company_id' => $this->companyId(),
                'default_key' => null,
                'title' => trim($data['title']),
                'sort_order' => (int) SafetyInductionTopic::where('company_id', $this->companyId())->max('sort_order') + 1,
                'is_active' => $data['is_active'] ?? true,
                'is_customised' => true,
            ]);
            $this->writeItems($topic, $data['items']);
        });

        $this->resync();

        return back()->with('success', 'Topic added.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $topic = $this->ownTopic($id);
        $data = $request->validate($this->rules());

        DB::transaction(function () use ($topic, $data) {
            $topic->update([
                'title' => trim($data['title']),
                'is_active' => $data['is_active'] ?? true,
                'is_customised' => true,
            ]);
            $this->writeItems($topic, $data['items']);
        });

        $this->resync();

        return back()->with('success', 'Topic saved.');
    }

    public function toggle(int $id): RedirectResponse
    {
        $topic = $this->ownTopic($id);
        $topic->update(['is_active' => !$topic->is_active]);
        $this->resync();

        return back()->with('success', $topic->is_active ? 'Topic is now shown to contractors.' : 'Topic is hidden from contractors.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $topic = $this->ownTopic($id);

        DB::transaction(function () use ($topic) {
            $topic->items()->delete();
            $topic->delete();
        });

        $this->resync();

        return back()->with('success', 'Topic deleted.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        DB::transaction(function () use ($data) {
            foreach (array_values($data['ids']) as $i => $id) {
                SafetyInductionTopic::where('company_id', $this->companyId())
                    ->where('id', $id)
                    ->update(['sort_order' => $i + 1]);
            }
        });

        return back();
    }

    /** Put one default topic back to its Appendix A wording. */
    public function reset(int $id): RedirectResponse
    {
        $topic = $this->ownTopic($id);
        $default = SafetyInductionDefaults::topics()[$topic->default_key] ?? null;

        if (!$default) {
            return back()->with('error', 'This is a custom topic, so there is no default to restore.');
        }

        DB::transaction(function () use ($topic, $default) {
            $topic->update(['title' => $default['title'], 'is_active' => true, 'is_customised' => false]);
            $topic->items()->delete();
            SafetyInductionDefaults::fillItems($topic, $default['blocks']);
        });

        $this->resync();

        return back()->with('success', 'Topic restored to the default text.');
    }

    /** Bring back default topics that were deleted (customised topics stay untouched). */
    public function restoreMissing(): RedirectResponse
    {
        $companyId = $this->companyId();
        $present = SafetyInductionTopic::where('company_id', $companyId)->pluck('default_key')->filter()->all();
        $order = (int) SafetyInductionTopic::where('company_id', $companyId)->max('sort_order');

        $count = 0;
        DB::transaction(function () use ($companyId, $present, &$order, &$count) {
            foreach (array_keys(SafetyInductionDefaults::topics()) as $key) {
                if (in_array($key, $present, true)) {
                    continue;
                }
                SafetyInductionDefaults::createTopic($companyId, $key, ++$order);
                $count++;
            }
        });

        $this->resync();

        return back()->with('success', $count ? "$count default topic(s) restored." : 'All default topics are already present.');
    }

    /** Wipe everything and start again from the 13 default topics. */
    public function resetAll(): RedirectResponse
    {
        $companyId = $this->companyId();

        DB::transaction(function () use ($companyId) {
            $ids = SafetyInductionTopic::where('company_id', $companyId)->pluck('id');
            SafetyInductionItem::whereIn('topic_id', $ids)->delete();
            SafetyInductionTopic::where('company_id', $companyId)->delete();
            SafetyInductionDefaults::seedFor($companyId);
        });

        $this->resync();

        return back()->with('success', 'All topics restored to the ' . count(SafetyInductionDefaults::topics()) . ' default declarations.');
    }
}
