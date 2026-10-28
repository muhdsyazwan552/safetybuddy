import React from 'react';
import { FileDown } from 'lucide-react';

/** Opens a generated PDF report in a new tab (server-side, see PdfReportController). */
export default function PdfButton({ href, label = 'PDF report', className = '' }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 ${className}`}
        >
            <FileDown className="h-4 w-4 text-red-600" />
            {label}
        </a>
    );
}
