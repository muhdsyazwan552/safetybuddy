import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

const CONTACT = { phone: '+60 16-886 5619', email: 'hello@sbcmeri.com', address: 'Kuala Lumpur, Malaysia' };

// hash links point at sections of the landing page, so on any other page they need the "/" in front
const COLUMNS = [
    { t: 'Product', l: [['What is CMERI', '/#top'], ['Framework', '/#cmeri'], ['Key modules', '/#modules'], ['Pricing', '/#pricing']] },
    { t: 'Company', l: [['Training Provider', '/training-providers'], ['Contact', '/#contact']] },
    { t: 'Access', l: [['Sign in', '/login'], ['Create account', '/register-view']] },
];

/** Footer for the public pages outside the landing page (e.g. the Training Provider directory). */
export default function PublicFooter() {
    return (
        <footer className="mt-16 border-t border-gray-200 bg-white">
            <div className="mx-auto max-w-[1200px] px-5 pb-8 pt-14 sm:px-8">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <img src="/images/sbc-header.png" alt="Safety Buddy – Cmeri" className="h-14 w-auto max-w-[220px] object-contain" />
                        <p className="mt-4 max-w-xs text-sm text-gray-500">Safety control, performance measurement and reporting for companies and contractors.</p>
                        <div className="mt-6 space-y-2 text-sm">
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-700" />{CONTACT.phone}</p>
                            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-700" />{CONTACT.email}</p>
                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-700" />{CONTACT.address}</p>
                        </div>
                    </div>

                    {COLUMNS.map((c) => (
                        <div key={c.t}>
                            <p className="text-sm font-semibold">{c.t}</p>
                            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
                                {c.l.map(([label, href]) => (
                                    <li key={label}><a href={href} className="transition hover:text-ink-950">{label}</a></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 text-xs text-gray-500 sm:flex-row">
                    <p>© {new Date().getFullYear()} Safety Buddy. All rights reserved.</p>
                    <div className="flex gap-5">
                        <a href="#" className="hover:text-ink-950">Privacy Policy</a>
                        <a href="#" className="hover:text-ink-950">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
