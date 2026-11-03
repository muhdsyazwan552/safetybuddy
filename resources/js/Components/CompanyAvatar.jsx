import React, { useState } from 'react';

export default function CompanyAvatar({ name = 'Company', logoUrl, className = '' }) {
    const [failedLogo, setFailedLogo] = useState(null);
    const initial = (name || 'C').trim().charAt(0).toUpperCase() || 'C';
    const showLogo = logoUrl && failedLogo !== logoUrl;

    return (
        <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg font-bold text-ink-950 ${showLogo ? 'bg-white' : 'bg-brand-500'} ${className}`} aria-label={`${name || 'Company'} logo`}>
            {showLogo
                ? <img src={logoUrl} alt="" className="h-full w-full object-contain p-0.5" onError={() => setFailedLogo(logoUrl)} />
                : initial}
        </span>
    );
}
