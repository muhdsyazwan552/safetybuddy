import React, { useSyncExternalStore } from 'react';
import { router } from '@inertiajs/react';

/**
 * One shared "please wait" state for the whole app:
 *  - page changes (Inertia visits) show a loading screen until the next page is ready,
 *  - every submit (Inertia, axios, fetch) shows a processing screen and blocks the page until the server answers,
 *  - a second identical submit while the first is still running is ignored, so a slow connection can never send the same data twice.
 */

let state = { navigating: 0, processing: 0 };
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const getState = () => state;

export const loadingStore = {
    begin(kind) { state = { ...state, [kind]: state[kind] + 1 }; emit(); },
    end(kind) { state = { ...state, [kind]: Math.max(0, state[kind] - 1) }; emit(); },
};

const isWrite = (method) => String(method || 'get').toLowerCase() !== 'get';

let installed = false;
export function installGlobalLoading() {
    if (installed || typeof window === 'undefined') return;
    installed = true;

    // ---- Inertia: page changes and form submits
    const tracked = new WeakMap();
    let writing = 0;
    router.on('before', (event) => {
        const visit = event.detail.visit;
        if (visit.prefetch || visit.async) return;
        // a submit is already running: ignore this one
        if (isWrite(visit.method) && writing > 0) return false;
    });
    router.on('start', (event) => {
        const visit = event.detail.visit;
        if (visit.prefetch || visit.async) return;
        const kind = isWrite(visit.method) ? 'processing' : (visit.preserveState ? null : 'navigating');
        tracked.set(visit, kind);
        if (isWrite(visit.method)) writing += 1;
        if (kind) loadingStore.begin(kind);
    });
    router.on('finish', (event) => {
        const visit = event.detail.visit;
        if (!tracked.has(visit)) return;
        const kind = tracked.get(visit);
        tracked.delete(visit);
        if (isWrite(visit.method)) writing = Math.max(0, writing - 1);
        if (kind) loadingStore.end(kind);
    });

    // ---- axios: write requests block the page and identical in-flight requests share one answer
    const axios = window.axios;
    if (axios) {
        const inflight = new Map();
        const adapter = axios.getAdapter(axios.defaults.adapter);
        axios.defaults.adapter = (config) => {
            if (!isWrite(config.method)) return adapter(config);
            const key = `${config.method}:${config.url}:${typeof config.data === 'string' ? config.data : JSON.stringify(config.data ?? '')}`;
            if (inflight.has(key)) return inflight.get(key);
            loadingStore.begin('processing');
            const promise = adapter(config).finally(() => { inflight.delete(key); loadingStore.end('processing'); });
            inflight.set(key, promise);
            return promise;
        };
    }

    // ---- fetch: same for write requests to our own server
    const nativeFetch = window.fetch.bind(window);
    const pending = new Map();
    window.fetch = (input, init = {}) => {
        const method = init.method || (typeof input !== 'string' && input?.method) || 'GET';
        if (!isWrite(method)) return nativeFetch(input, init);
        const url = typeof input === 'string' ? input : input?.url;
        const key = `${String(method).toLowerCase()}:${url}:${typeof init.body === 'string' ? init.body : init.body instanceof FormData ? '[form]' : ''}`;
        if (pending.has(key) && !(init.body instanceof FormData)) return pending.get(key).then((response) => response.clone());
        loadingStore.begin('processing');
        const promise = nativeFetch(input, init).finally(() => { pending.delete(key); loadingStore.end('processing'); });
        pending.set(key, promise);
        return promise;
    };
}

export default function GlobalLoading() {
    const { navigating, processing } = useSyncExternalStore(subscribe, getState, getState);
    if (!navigating && !processing) return null;

    return (
        <div className="fixed inset-0 z-[9999] cursor-progress" role="status" aria-live="polite" aria-busy="true">
            <style>{'@keyframes sbLoadingIn{from{opacity:0}to{opacity:1}}'}</style>
            {/* blocks every click at once; the visible screen fades in after a moment so quick pages do not flicker */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]" style={{ animation: 'sbLoadingIn .2s ease-out .35s both' }}>
                <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-2xl bg-ink-950 px-8 py-6 text-center text-white shadow-2xl">
                    <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-brand-400" />
                    <p className="text-base font-bold">{processing ? 'Processing…' : 'Loading…'}</p>
                    <p className="text-xs leading-5 text-white/70">{processing ? 'Please wait. Do not press the button again or close this page.' : 'Please wait while the page loads.'}</p>
                </div>
            </div>
        </div>
    );
}
