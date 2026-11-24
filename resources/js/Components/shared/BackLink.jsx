import React from 'react';
import { Link } from '@inertiajs/react';

export default function BackLink({ href, children, ...props }) {
    const goBack = (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const canGoBack = window.navigation?.canGoBack ?? window.history.length > 1;
        if (canGoBack) {
            event.preventDefault();
            window.history.back();
        }
    };

    return <Link href={href} onClick={goBack} {...props}>{children}</Link>;
}
