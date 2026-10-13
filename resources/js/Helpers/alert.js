// Central SweetAlert2 helper – every popup in the app goes through here so they
// all share one modern look (styles: resources/css/app.css, `.sb-swal*`).
import Swal from 'sweetalert2';

const classes = {
    popup: 'sb-swal',
    title: 'sb-swal-title',
    htmlContainer: 'sb-swal-text',
    actions: 'sb-swal-actions',
    confirmButton: 'sb-swal-btn sb-swal-confirm',
    cancelButton: 'sb-swal-btn sb-swal-cancel',
    denyButton: 'sb-swal-btn sb-swal-deny',
    closeButton: 'sb-swal-close',
    icon: 'sb-swal-icon',
};

const modal = Swal.mixin({
    buttonsStyling: false,
    reverseButtons: true,
    heightAuto: false,
    customClass: classes,
    showClass: { popup: 'sb-swal-in' },
    hideClass: { popup: 'sb-swal-out' },
});

const toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    timer: 3800,
    timerProgressBar: true,
    buttonsStyling: false,
    customClass: { ...classes, popup: 'sb-toast', title: 'sb-toast-title', htmlContainer: 'sb-toast-text' },
    showClass: { popup: 'sb-toast-in' },
    hideClass: { popup: 'sb-toast-out' },
    didOpen: (el) => {
        el.addEventListener('mouseenter', Swal.stopTimer);
        el.addEventListener('mouseleave', Swal.resumeTimer);
    },
});

const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// long messages are easier to read in a dialog than in a corner toast
const isLong = (m) => String(m ?? '').length > 110 || String(m ?? '').includes('\n');

const notify = (icon, defaultTitle, message, title) => {
    const text = typeof message === 'string' ? message : message?.message || '';
    const heading = title || defaultTitle;

    if (isLong(text)) {
        return modal.fire({
            icon,
            title: heading,
            html: `<div class="sb-swal-multiline">${esc(text).replace(/\n/g, '<br>')}</div>`,
            confirmButtonText: 'Got it',
        });
    }
    return toast.fire({ icon, title: heading, text });
};

export const showAlert = {
    success: (message, title = 'Done') => notify('success', 'Done', message, title),
    error: (message, title = 'Something went wrong') => notify('error', 'Something went wrong', message, title),
    warning: (message, title = 'Please note') => notify('warning', 'Please note', message, title),
    info: (message, title = 'Info') => notify('info', 'Info', message, title),

    /** Blocking spinner dialog – close it with showAlert.close() */
    loading: (message = 'Please wait…', title = 'Working') =>
        modal.fire({
            title,
            text: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
        }),

    close: () => Swal.close(),

    /**
     * Yes / no question. Resolves to true / false.
     * opts: { confirmText, cancelText, icon, danger, details: string[] }
     */
    confirm: async (message, title = 'Are you sure?', opts = {}) => {
        const { confirmText = 'Yes, continue', cancelText = 'Cancel', icon = 'question', danger = false, details = [] } = opts;
        const list = details.length
            ? `<ul class="sb-swal-list">${details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`
            : '';
        const result = await modal.fire({
            icon: danger ? 'warning' : icon,
            title,
            html: `<div class="sb-swal-multiline">${esc(message).replace(/\n/g, '<br>')}</div>${list}`,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            focusCancel: danger,
            customClass: {
                ...classes,
                confirmButton: `sb-swal-btn ${danger ? 'sb-swal-danger' : 'sb-swal-confirm'}`,
            },
        });
        return result.isConfirmed;
    },

    /** Destructive confirmation (red button, cancel focused by default) */
    confirmDelete: (message = 'This cannot be undone.', title = 'Delete this item?', opts = {}) =>
        showAlert.confirm(message, title, { confirmText: 'Yes, delete', danger: true, ...opts }),

    /** List of validation problems in one clear dialog */
    errors: (errors, title = 'Please check the form') => {
        const items = Array.isArray(errors)
            ? errors
            : Object.values(errors || {}).flat();
        return modal.fire({
            icon: 'error',
            title,
            html: `<ul class="sb-swal-list sb-swal-list-error">${items.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`,
            confirmButtonText: 'Fix it',
        });
    },
};

export default showAlert;
