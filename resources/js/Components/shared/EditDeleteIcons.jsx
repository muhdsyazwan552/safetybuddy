// Icon-only edit + delete pair used on every toolbox talk / inspection card.
import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { showAlert } from '@/Helpers/alert';

const base = 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition active:scale-95';
const editCls = `${base} border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200`;
const fixCls = `${base} border-red-600 bg-red-600 text-white hover:bg-red-700`;
const delCls = `${base} border-red-200 bg-red-50 text-red-600 hover:bg-red-100`;

export default function EditDeleteIcons({ editHref, deleteUrl, what = 'record', note, returned = false }) {
    const remove = async () => {
        const ok = await showAlert.confirmDelete(note || 'This cannot be undone.', `Delete this ${what}?`);
        if (ok) router.delete(deleteUrl, { preserveScroll: true });
    };

    return (
        <div className="flex items-center gap-2">
            {editHref && (
                <Link href={editHref} className={returned ? fixCls : editCls} title={`${returned ? 'Fix' : 'Edit'} ${what}`} aria-label={`${returned ? 'Fix' : 'Edit'} ${what}`}>
                    <Pencil className="h-4 w-4" />
                </Link>
            )}
            {deleteUrl && (
                <button type="button" onClick={remove} className={delCls} title={`Delete ${what}`} aria-label={`Delete ${what}`}>
                    <Trash2 className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
