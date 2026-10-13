import React, { useEffect, useState } from 'react';
import { Link2, Copy, Check, X, ExternalLink, Share2, Mail, MessageCircle, ShieldAlert, UserPlus } from 'lucide-react';

/**
 * Public registration links for a subcontractor (executor) company.
 *   staff  → /subcon/{token}/staff   people can register themselves
 *   leader → /subcon/{token}/leader  can also edit / remove staff
 */
export function subconLinks(token, leaderKey) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
        staff: `${origin}/subcon/${token}/staff`,
        leader: leaderKey ? `${origin}/subcon/${token}/leader/${leaderKey}` : null,
    };
}

function LinkRow({ icon: Icon, tone, title, hint, url, companyName, warn }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
        } catch (e) {
            // clipboard API unavailable (http / old browser) → fallback
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const message = `Register as staff of ${companyName} (Safety Buddy):\n${url}`;
    const canShare = typeof navigator !== 'undefined' && !!navigator.share;

    return (
        <div className={`rounded-2xl border p-4 ${warn ? 'border-amber-200 bg-amber-50/60' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-extrabold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500">{hint}</p>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1.5">
                <input
                    readOnly
                    value={url}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 truncate border-0 bg-transparent px-2 py-1.5 text-xs text-gray-700 focus:ring-0"
                />
                <button
                    type="button"
                    onClick={copy}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition active:scale-95 ${
                        copied ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-ink-900'
                    }`}
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
                <a
                    href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a
                    href={`mailto:?subject=${encodeURIComponent(`Staff registration – ${companyName}`)}&body=${encodeURIComponent(message)}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
                >
                    <Mail className="h-4 w-4" /> Email
                </a>
                {canShare && (
                    <button
                        type="button"
                        onClick={() => navigator.share({ title: `${companyName} staff registration`, text: message, url }).catch(() => {})}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
                    >
                        <Share2 className="h-4 w-4" /> Share…
                    </button>
                )}
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
                >
                    <ExternalLink className="h-4 w-4" /> Open
                </a>
            </div>

            {warn && (
                <p className="mt-3 flex items-start gap-1.5 text-[11px] font-semibold text-amber-700">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    This link can edit and remove staff. Only send it to the company leader.
                </p>
            )}
        </div>
    );
}

export default function ShareSubconLink({ company, open, onClose }) {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open || !company) return null;

    const hasToken = !!company.public_token;
    const links = hasToken ? subconLinks(company.public_token, company.leader_key) : null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
                            <Link2 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-base font-extrabold text-gray-900">Share registration link</h3>
                            <p className="truncate text-xs text-gray-500">{company.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    {!hasToken ? (
                        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                            This company has no public link yet. Save the company once more to generate it, or contact support.
                        </p>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600">
                                Send this link to the company so their workers can add themselves — no login needed.
                            </p>

                            <LinkRow
                                icon={UserPlus}
                                tone="bg-brand-100 text-brand-900"
                                title="Staff registration link"
                                hint="Workers can add themselves to the company."
                                url={links.staff}
                                companyName={company.name}
                            />

                            {links.leader && (
                                <LinkRow
                                    icon={ShieldAlert}
                                    tone="bg-amber-100 text-amber-700"
                                    title="Leader link"
                                    hint="Register, edit and remove staff for this company."
                                    url={links.leader}
                                    companyName={company.name}
                                    warn
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
