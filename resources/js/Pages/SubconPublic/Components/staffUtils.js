// Helpers shared by the public subcontractor pages.

// Fields a staff record needs before we call it "complete".
export const REQUIRED_FIELDS = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'contact', label: 'Phone' },
    { key: 'role', label: 'Role' },
];

const filled = (v) => String(v ?? '').trim() !== '';

export function completeness(staff) {
    const missing = REQUIRED_FIELDS.filter((f) => !filled(staff[f.key]));
    const done = REQUIRED_FIELDS.length - missing.length;
    return {
        done,
        total: REQUIRED_FIELDS.length,
        pct: Math.round((done / REQUIRED_FIELDS.length) * 100),
        missing,
        isComplete: missing.length === 0,
    };
}

export function formatDate(value, withTime = false) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
}

export function timeAgo(value) {
    if (!value) return '';
    const d = new Date(value).getTime();
    if (Number.isNaN(d)) return '';
    const days = Math.floor((Date.now() - d) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return months < 12 ? `${months} month${months > 1 ? 's' : ''} ago` : `${Math.floor(months / 12)} yr ago`;
}

export function initials(name = '') {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p.charAt(0).toUpperCase())
            .join('') || '?'
    );
}

export function isNewThisWeek(staff) {
    if (!staff.created_at) return false;
    return Date.now() - new Date(staff.created_at).getTime() < 7 * 86400000;
}

// status values in the database are not consistent in case ("active", "Inactive")
export const isActiveStatus = (status) => String(status || 'active').trim().toLowerCase() === 'active';
