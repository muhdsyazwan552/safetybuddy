import React, { useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Lock,
    Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw, Save, X, GripVertical, BookOpen,
    ListChecks, Heading, Type, Quote, ShieldCheck, Loader2, History, FileText, CheckCircle2,
} from 'lucide-react';
import AppLayout from '@/Pages/WSIS/Layout';
import { showAlert } from '@/Helpers/alert';

const TYPES = [
    { key: 'subheading', label: 'Sub-heading', icon: Heading, hint: 'e.g. "Workers must:"' },
    { key: 'bullet', label: 'Bullet point', icon: ListChecks, hint: 'One rule or item' },
    { key: 'paragraph', label: 'Paragraph', icon: Type, hint: 'Normal sentence' },
    { key: 'highlight', label: 'Highlight', icon: Quote, hint: 'Key message, shown in yellow' },
];
const typeMeta = Object.fromEntries(TYPES.map((t) => [t.key, t]));

const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/20';

/** Renders blocks the way contractors will read them (bullets grouped into lists). */
function Blocks({ items }) {
    const out = [];
    let bullets = [];
    const flush = (k) => {
        if (bullets.length) {
            out.push(
                <ul key={`ul-${k}`} className="mb-3 space-y-1.5 pl-1">
                    {bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[15px] text-gray-700">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                            <span>{b}</span>
                        </li>
                    ))}
                </ul>
            );
            bullets = [];
        }
    };
    items.forEach((it, i) => {
        if (it.type === 'bullet') {
            bullets.push(it.content);
            return;
        }
        flush(i);
        if (it.type === 'subheading') {
            out.push(<p key={i} className="mb-2 mt-4 text-[15px] font-extrabold text-gray-900 first:mt-0">{it.content}</p>);
        } else if (it.type === 'highlight') {
            out.push(
                <p key={i} className="mb-3 rounded-2xl border border-brand-300 bg-brand-100 px-4 py-3 text-[15px] font-extrabold text-ink-900">
                    {it.content}
                </p>
            );
        } else {
            out.push(<p key={i} className="mb-3 text-[15px] leading-relaxed text-gray-700">{it.content}</p>);
        }
    });
    flush('end');
    return <div>{out}</div>;
}

function Badge({ children, tone = 'gray' }) {
    const tones = {
        gray: 'bg-gray-100 text-gray-600',
        green: 'bg-emerald-100 text-emerald-700',
        yellow: 'bg-brand-100 text-brand-900',
        red: 'bg-red-100 text-red-700',
        dark: 'bg-ink-900 text-brand-400',
    };
    return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
}

/** Inline editor for one topic (or a new one). */
function TopicEditor({ draft, setDraft, onSave, onCancel, onReset, saving, error, isNew, canReset }) {
    const setItem = (i, patch) =>
        setDraft({ ...draft, items: draft.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= draft.items.length) return;
        const items = [...draft.items];
        [items[i], items[j]] = [items[j], items[i]];
        setDraft({ ...draft, items });
    };
    const remove = (i) => setDraft({ ...draft, items: draft.items.filter((_, idx) => idx !== i) });
    const add = (type) => setDraft({ ...draft, items: [...draft.items, { type, content: '' }] });

    return (
        <div className="border-t border-gray-100 bg-gray-50/60 p-5">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Topic title</label>
            <input
                className={`${inputClass} text-base font-bold`}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Fire Safety"
            />

            <div className="mt-5 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Content ({draft.items.length})</p>
            </div>

            <div className="mt-2 space-y-2.5">
                {draft.items.map((it, i) => {
                    const meta = typeMeta[it.type] || typeMeta.bullet;
                    return (
                        <div key={i} className="flex items-start gap-2 rounded-2xl border border-gray-200 bg-white p-2.5">
                            <GripVertical className="mt-3 hidden h-4 w-4 shrink-0 text-gray-300 sm:block" />
                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <meta.icon className="h-4 w-4 text-gray-400" />
                                    <select
                                        value={it.type}
                                        onChange={(e) => setItem(i, { type: e.target.value })}
                                        className="rounded-lg border-gray-200 bg-gray-50 py-1 pl-2 pr-8 text-xs font-bold text-gray-700"
                                    >
                                        {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                                    </select>
                                    <span className="hidden text-[11px] text-gray-400 sm:inline">{meta.hint}</span>
                                </div>
                                <textarea
                                    rows={it.content.length > 90 ? 3 : 1}
                                    value={it.content}
                                    onChange={(e) => setItem(i, { content: e.target.value })}
                                    className={`${inputClass} resize-y ${it.type === 'subheading' ? 'font-bold' : ''}`}
                                    placeholder={meta.hint}
                                />
                            </div>
                            <div className="flex shrink-0 flex-col gap-1">
                                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 disabled:opacity-30" aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
                                <button type="button" onClick={() => move(i, 1)} disabled={i === draft.items.length - 1} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 disabled:opacity-30" aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
                                <button type="button" onClick={() => remove(i)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500" aria-label="Remove line"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {TYPES.map((t) => (
                    <button key={t.key} type="button" onClick={() => add(t.key)} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:border-brand-500 hover:text-ink-900">
                        <Plus className="h-3.5 w-3.5" /> {t.label}
                    </button>
                ))}
            </div>

            <label className="mt-5 flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Show this topic to contractors
            </label>

            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-2">
                <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isNew ? 'Add topic' : 'Save changes'}
                </button>
                <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                    <X className="h-4 w-4" /> Cancel
                </button>
                {canReset && (
                    <button type="button" onClick={onReset} className="ml-auto inline-flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-50">
                        <RotateCcw className="h-4 w-4" /> Restore default text
                    </button>
                )}
            </div>
        </div>
    );
}

export default function Safety_Induction({ topics = [], defaultCount = 14 }) {
    const { errors } = usePage().props;
    const [tab, setTab] = useState('edit');
    const [openId, setOpenId] = useState(null);
    const [editingId, setEditingId] = useState(null); // topic id | 'new'
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const stats = useMemo(() => ({
        total: topics.length,
        shown: topics.filter((t) => t.is_active).length,
        custom: topics.filter((t) => !t.default_key).length,
    }), [topics]);

    const startEdit = (t) => {
        setError('');
        setOpenId(t.id);
        setEditingId(t.id);
        setDraft({ title: t.title, is_active: t.is_active, items: t.items.map((i) => ({ ...i })) });
    };
    const startNew = () => {
        setError('');
        setTab('edit');
        setEditingId('new');
        setOpenId(null);
        setDraft({ title: '', is_active: true, items: [{ type: 'bullet', content: '' }] });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const cancel = () => {
        setEditingId(null);
        setDraft(null);
        setError('');
    };

    const validate = () => {
        if (!draft.title.trim()) return 'Please enter a topic title.';
        const items = draft.items.filter((i) => i.content.trim());
        if (items.length === 0) return 'Add at least one line of content.';
        return '';
    };

    const save = () => {
        const msg = validate();
        if (msg) { setError(msg); return; }

        const payload = {
            title: draft.title.trim(),
            is_active: draft.is_active,
            items: draft.items.filter((i) => i.content.trim()).map((i) => ({ type: i.type, content: i.content.trim() })),
        };
        setSaving(true);
        const opts = {
            preserveScroll: true,
            onSuccess: () => cancel(),
            onError: (errs) => setError(Object.values(errs)[0] || 'Could not save. Please check the fields.'),
            onFinish: () => setSaving(false),
        };
        if (editingId === 'new') router.post('/safety-passport/topics', payload, opts);
        else router.put(`/safety-passport/topics/${editingId}`, payload, opts);
    };

    const move = (id, dir) => {
        const ids = topics.filter((t) => !t.default_key).map((t) => t.id);
        const index = ids.indexOf(id);
        const j = index + dir;
        if (index < 0 || j < 0 || j >= ids.length) return;
        [ids[index], ids[j]] = [ids[j], ids[index]];
        router.post('/safety-passport/reorder', { ids }, { preserveScroll: true });
    };

    const toggle = (t) => router.patch(`/safety-passport/topics/${t.id}/toggle`, {}, { preserveScroll: true });

    const remove = async (t) => {
        const ok = await showAlert.confirmDelete(
            `"${t.title}" will be permanently removed.`,
            'Delete this topic?',
            { confirmText: 'Yes, delete' }
        );
        if (ok) router.delete(`/safety-passport/topics/${t.id}`, { preserveScroll: true });
    };

    const visible = topics.filter((t) => t.is_active);

    return (
        <AppLayout title="Safety Passport">
            <Head title="Safety Passport" />

            <div className="mx-auto max-w-5xl space-y-5 pb-10">
                {/* header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg sm:p-7">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-500/20 blur-2xl" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-ink-900"><ShieldCheck className="h-6 w-6" /></span>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400"></p>
                                <h1 className="text-2xl font-extrabold">Safety Passport</h1>
                                <p className="mt-1 max-w-xl text-sm text-gray-300">
                                    Set your safety rules and requirements. Contractors must review and formally declare their commitment to comply through the Contractor Portal.
                                </p>
                            </div>
                        </div>
                        <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
                            {[['Topics', stats.total], ['Shown', stats.shown], ['Added by you', stats.custom]].map(([l, v]) => (
                                <div key={l} className="rounded-2xl bg-white/10 px-4 py-3">
                                    <p className="text-2xl font-extrabold text-brand-400">{v}</p>
                                    <p className="text-[11px] text-gray-300">{l}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* sampling objective */}
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-slate-700">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-800">Safety Passport Sampling &ndash; Objective</p>
                    <p className="mt-1.5">
                        To verify that workers are registered under the project workforce and have acknowledged the Safety Passport rules through the
                        Contractor Portal. Unregistered workers are considered to have unverified awareness and commitment to comply with project safety requirements.
                    </p>
                </div>

                {/* toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex rounded-2xl bg-gray-200/70 p-1">
                        {[['edit', 'Edit topics', FileText], ['preview', 'Contractor preview', BookOpen]].map(([k, l, Icon]) => (
                            <button key={k} onClick={() => setTab(k)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === k ? 'bg-white text-ink-900 shadow' : 'text-gray-500'}`}>
                                <Icon className="h-4 w-4" /> {l}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={startNew} className="sb-create">
                            <Plus className="h-4 w-4" strokeWidth={3} /> Add topic
                        </button>
                    </div>
                </div>

                {/* ------------------------------ edit tab ------------------------------ */}
                {tab === 'edit' && (
                    <div className="space-y-3">
                        {editingId === 'new' && draft && (
                            <section className="overflow-hidden rounded-3xl border-2 border-brand-500 bg-white shadow-sm">
                                <div className="flex items-center gap-3 px-5 py-4">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-ink-900"><Plus className="h-5 w-5" strokeWidth={3} /></span>
                                    <p className="font-extrabold text-gray-900">New topic</p>
                                </div>
                                <TopicEditor draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} saving={saving} error={error || errors?.title} isNew />
                            </section>
                        )}

                        {topics.map((t, index) => {
                            const customCount = topics.filter((x) => !x.default_key).length;
                            const customIdx = topics.filter((x) => !x.default_key).findIndex((x) => x.id === t.id);
                            const open = openId === t.id;
                            const editing = editingId === t.id;
                            return (
                                <section key={t.id} className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${editing ? 'border-2 border-brand-500' : open ? 'border-gray-300' : 'border-gray-100'} ${!t.is_active ? 'opacity-70' : ''}`}>
                                    <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                                        <button onClick={() => setOpenId(open ? null : t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-sm font-extrabold text-brand-400">{index + 1}</span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-[15px] font-extrabold text-gray-900">{t.title}</span>
                                                {t.items[0] && <span className="block max-w-xl truncate text-xs font-normal text-gray-500">{t.items[0].content}</span>}
                                                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                                    {t.default_key === 1 ? <Badge tone="green">Default · locked</Badge> : t.default_key ? <Badge tone="green">Default</Badge> : <Badge tone="dark">Custom</Badge>}
                                                    {!t.is_active && <Badge tone="red">Hidden</Badge>}
                                                    <span className="text-[11px] text-gray-400">{t.items.length} lines</span>
                                                </span>
                                            </span>
                                        </button>

                                        {t.default_key === 1 ? (
                                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-500" title="This rule is fixed"><Lock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Locked</span></span>
                                        ) : (
                                        <div className="flex shrink-0 items-center gap-1">
                                            {!t.default_key && <>
                                            <button onClick={() => move(t.id, -1)} disabled={customIdx === 0} className="hidden h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 sm:flex" title="Move up"><ChevronUp className="h-4 w-4" /></button>
                                            <button onClick={() => move(t.id, 1)} disabled={customIdx === customCount - 1} className="hidden h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 sm:flex" title="Move down"><ChevronDown className="h-4 w-4" /></button>
                                            </>}
                                            <button onClick={() => toggle(t)} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100" title={t.is_active ? 'Hide from contractors' : 'Show to contractors'}>
                                                {t.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </button>
                                            <button onClick={() => (editing ? cancel() : startEdit(t))} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-ink-900 px-3 text-xs font-bold text-brand-400" title="Edit">
                                                <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                                            </button>
                                            {!t.default_key && <button onClick={() => remove(t)} className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>}
                                        </div>
                                        )}
                                    </div>

                                    {editing && draft ? (
                                        <TopicEditor
                                            draft={draft}
                                            setDraft={setDraft}
                                            onSave={save}
                                            onCancel={cancel}
                                            saving={saving}
                                            error={error || errors?.title || errors?.items}
                                        />
                                    ) : (
                                        open && (
                                            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                                                <Blocks items={t.items} />
                                            </div>
                                        )
                                    )}
                                </section>
                            );
                        })}
                    </div>
                )}

                {/* ------------------------------ preview tab ------------------------------ */}
                {tab === 'preview' && (
                    <div className="mx-auto max-w-3xl space-y-4">
                        <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                            <p>This is how contractors read the induction before declaring. Hidden topics are not shown ({stats.total - stats.shown} hidden).</p>
                        </div>

                        {visible.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-gray-400">No topics are shown to contractors.</p>}

                        {visible.map((t, i) => (
                            <article key={t.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-3 text-xl font-extrabold tracking-tight text-gray-900">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-base text-ink-900">{i + 1}</span>
                                    {t.title}
                                </h2>
                                <Blocks items={t.items} />
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
