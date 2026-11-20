// Date field that always shows day / month / year (dd/mm/yyyy), whatever the browser language is.
// Drop-in for <input type="date">: value and onChange use the same "YYYY-MM-DD" string
// (onChange receives { target: { name, value } }), min / max are "YYYY-MM-DD" too.
import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';

const toDisplay = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

// "dd/mm/yyyy" -> "YYYY-MM-DD", or null when it is not a real calendar date
const toIso = (text) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (!m) return null;
    const [, d, mo, y] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    const real = date.getFullYear() === Number(y) && date.getMonth() === Number(mo) - 1 && date.getDate() === Number(d);

    return real ? `${y}-${mo}-${d}` : null;
};

// keeps only digits and puts the slashes in while typing
const mask = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function DateInput({ value = '', onChange, min, max, className = '', name, disabled, required, placeholder = 'dd/mm/yyyy', ...rest }) {
    const [text, setText] = useState(toDisplay(value));
    const picker = useRef(null);

    // follow the value when the page changes it (reset, loaded record, calendar pick)
    useEffect(() => {
        if (toIso(text) !== (value || null)) setText(toDisplay(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const emit = (iso) => onChange?.({ target: { name, value: iso }, currentTarget: { name, value: iso } });
    const inRange = (iso) => (!min || iso >= min) && (!max || iso <= max);

    const type = (e) => {
        const next = mask(e.target.value);
        setText(next);
        if (next === '') return emit('');
        const iso = toIso(next);
        if (iso && inRange(iso)) emit(iso);
    };

    // leaving the field with something incomplete / out of range puts the last valid date back
    const leave = (e) => {
        const iso = toIso(text);
        if (text !== '' && !(iso && inRange(iso))) setText(toDisplay(value));
        rest.onBlur?.(e);
    };

    const openCalendar = () => {
        const el = picker.current;
        if (!el || disabled) return;
        try { el.showPicker(); } catch { el.focus(); el.click(); }
    };

    return (
        <div className="relative block">
            <input
                {...rest}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                name={name}
                value={text}
                onChange={type}
                onBlur={leave}
                placeholder={placeholder}
                maxLength={10}
                disabled={disabled}
                required={required}
                className={`${className} !pr-10`}
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={openCalendar}
                disabled={disabled}
                aria-label="Open calendar"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-gray-700 disabled:opacity-40"
            >
                <CalendarDays className="h-4 w-4" />
            </button>
            {/* the browser calendar, only used for picking */}
            <input
                ref={picker}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                value={value || ''}
                min={min}
                max={max}
                onChange={(e) => { setText(toDisplay(e.target.value)); emit(e.target.value); }}
                className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0"
            />
        </div>
    );
}
