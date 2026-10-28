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
 * Performance Settings > Safety Passport Rules.
 * The 14 default rules are fixed for every company (read only). The Manager can add, edit,
 * hide, delete and reorder their own extra topics.
 */
class SafetyInductionController extends Controller
{
    private function companyId(): int
    {
        return (int) Auth::user()->company_id;
    }

    private function ownTopic(int $id): SafetyInductionTopic
    {
        $topic = SafetyInductionTopic::where('company_id', $this->companyId())->findOrFail($id);
        abort_unless($topic->default_key === null, 403, 'The default Safety Passport rules are fixed and cannot be changed.');

        return $topic;
    }

    /** Subcontractors must re-tick when the induction content changes. */
    private function resync(): void
    {
        SubconCompliance::syncAllFor($this->companyId());
    }

    public function index(): Response
    {
        $companyId = $this->companyId();

        // the 14 default rules are the same for every company (missing / edited ones are put back)
        if (SafetyInductionDefaults::ensure($companyId)) {
            $this->resync();
        }

        $topics = SafetyInductionTopic::with('items')
            ->where('company_id', $companyId)
            ->where(fn ($query) => $query->whereNull('default_key')->orWhere('default_key', '<=', 14))
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

        return Inertia::render('WSIS/Safety_Induction', [
            'title' => 'Safety Passport',
            'topics' => $topics,
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
                    ->whereNull('default_key')
                    ->where('id', $id)
                    ->update(['sort_order' => $i + 1]);
            }
        });

        return back();
    }
}
