import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

/** Shared layout for the Terms of Service and Privacy Policy pages. */
export default function LegalPage({ title, updated, intro, sections }) {
    return (
        <>
            <Head title={`${title} · Safety Buddy`} />
            <div className="min-h-screen bg-[#F8F8F5] text-ink-900">
                <PublicNavbar />

                <main className="mx-auto max-w-3xl px-5 pb-6 pt-32 sm:px-8">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                    <p className="mt-2 text-sm text-gray-500">Last updated: {updated}</p>
                    <p className="mt-6 leading-7 text-gray-700">{intro}</p>

                    <nav className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
                        <p className="text-sm font-semibold">Contents</p>
                        <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-gray-600">
                            {sections.map((s, i) => (
                                <li key={s.h}><a href={`#s${i + 1}`} className="hover:text-brand-700">{s.h}</a></li>
                            ))}
                        </ol>
                    </nav>

                    <div className="mt-10 space-y-8">
                        {sections.map((s, i) => (
                            <section key={s.h} id={`s${i + 1}`} className="scroll-mt-28">
                                <h2 className="text-xl font-semibold">{i + 1}. {s.h}</h2>
                                {s.p?.map((t, j) => <p key={j} className="mt-3 leading-7 text-gray-700">{t}</p>)}
                                {s.ul && (
                                    <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-7 text-gray-700">
                                        {s.ul.map((t, j) => <li key={j}>{t}</li>)}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </div>

                    <p className="mt-12 text-sm text-gray-500">
                        See also: <Link href="/terms" className="underline">Terms of Service</Link> · <Link href="/privacy" className="underline">Privacy Policy</Link>
                    </p>
                </main>

                <PublicFooter />
            </div>
        </>
    );
}
