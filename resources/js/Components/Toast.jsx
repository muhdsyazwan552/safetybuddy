import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { showAlert } from '@/Helpers/alert';

// Shows Laravel flash messages (->with('success' | 'error' | 'warning' | 'info', ...)).
export default function Toast() {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) showAlert.success(flash.success);
        if (flash?.error) showAlert.error(flash.error);
        if (flash?.warning) showAlert.warning(flash.warning);
        if (flash?.info) showAlert.info(flash.info);
    }, [flash]);

    return null;
}
