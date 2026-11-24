import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

export function isImageUrl(src) {
    return Boolean(src && /\.(?:avif|gif|jpe?g|png|webp|bmp)(?:[?#]|$)/i.test(src));
}

export default function ImageViewer({ src, label = 'Image', children, ...props }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button type="button" aria-haspopup="dialog" aria-label={`View ${label}`} onClick={() => setOpen(true)} {...props}>
                {children}
            </button>
            <Dialog open={open} onClose={setOpen} className="relative z-[100]">
                <DialogBackdrop className="fixed inset-0 bg-black/90" />
                <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
                    <DialogPanel className="flex max-h-full w-full max-w-6xl flex-col gap-3">
                        <div className="flex items-center justify-between gap-4 text-white">
                            <DialogTitle className="min-w-0 truncate text-sm font-semibold">{label}</DialogTitle>
                            <button type="button" data-autofocus onClick={() => setOpen(false)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                                <X aria-hidden="true" className="h-5 w-5" /> Close
                            </button>
                        </div>
                        <img src={src} alt={label} className="min-h-0 max-w-full self-center object-contain" />
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    );
}

export function AttachmentLink({ href, label, children, ...props }) {
    return isImageUrl(href)
        ? <ImageViewer src={href} label={label} {...props}>{children}</ImageViewer>
        : <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>;
}
