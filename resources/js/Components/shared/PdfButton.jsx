import React from 'react';
import { FileDown } from 'lucide-react';

/** Opens the report preview in a new tab. */
export default function PdfButton({ href, label = 'Generate Report', className = '' }) {
    return (
        <a
            href={`${href}${href.includes('?') ? '&' : '?'}preview=1`}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 ${className}`}
        >
            <FileDown className="h-4 w-4 text-red-600" />
            {label}
        </a>
    );
}
