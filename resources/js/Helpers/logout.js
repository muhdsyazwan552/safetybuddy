import { router } from '@inertiajs/react';
import { showAlert } from '@/Helpers/alert';

/** Every logout in the system asks first. */
export async function confirmLogout(url = '/logout') {
    const ok = await showAlert.confirm(
        'You will need to sign in again to continue.',
        'Log out?',
        { confirmText: 'Yes, log out', cancelText: 'Stay signed in', icon: 'question' },
    );

    if (ok) {
        router.post(url);
    }
}
