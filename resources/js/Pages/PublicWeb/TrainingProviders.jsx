import React, { useEffect, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    AnimatePresence,
    animate,
    motion,
    useReducedMotion,
} from "framer-motion";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import {
    ArrowRight,
    Building2,
    ChevronDown,
    LoaderCircle,
    LocateFixed,
    Mail,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

/** Counts up to the value; shows it straight away when motion is reduced. */
function CountUp({ value, reduce }) {
    const target = Number(value) || 0;
    const [shown, setShown] = useState(reduce ? target : 0);
    useEffect(() => {
        if (reduce) {
            setShown(target);
            return undefined;
        }
        const controls = animate(shown, target, {
            duration: 0.9,
            ease,
            onUpdate: (v) => setShown(Math.round(v)),
        });
        return () => controls.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, reduce]);
    return <>{shown.toLocaleString()}</>;
}

function Logo({ provider }) {
    if (provider.logo_url)
        return (
            <img
                src={provider.logo_url}
                alt=""
                className="h-full w-full rounded-xl object-contain"
            />
        );
    return (
        <span className="flex h-full w-full items-center justify-center rounded-xl bg-ink-900 text-3xl font-black text-brand-400">
            {(provider.name || "?").charAt(0).toUpperCase()}
        </span>
    );
}

function ProviderCard({ provider, index, reduce }) {
    const [open, setOpen] = useState(false);
    const hasContact = provider.email || provider.contact;

    return (
        <motion.article
            layout={reduce ? false : "position"}
            initial={{ opacity: 0, y: reduce ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -12 }}
            transition={{
                duration: 0.55,
                ease,
                delay: Math.min(index, 8) * 0.07,
            }}
            whileHover={reduce ? undefined : { y: -4 }}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-brand-400 hover:shadow-xl sm:px-5"
        >
            <span
                className="absolute inset-y-0 left-0 w-1.5 origin-left bg-brand-400 transition-all duration-300 group-hover:w-2.5"
                aria-hidden="true"
            />
            <span
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-400/0 blur-2xl transition-colors duration-500 group-hover:bg-brand-400/20"
                aria-hidden="true"
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                <motion.div
                    whileHover={reduce ? undefined : { rotate: -4, scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-1.5"
                >
                    <Logo provider={provider} />
                </motion.div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="text-lg font-extrabold text-ink-900">
                            {provider.name}
                        </h2>
                        {provider.distance_km !== null &&
                            provider.distance_km !== undefined && (
                                <motion.span
                                    initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 380,
                                        damping: 16,
                                        delay: 0.25,
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-3 py-1 text-xs font-bold text-brand-400"
                                >
                                    <LocateFixed className="h-3.5 w-3.5" />{" "}
                                    {provider.distance_km} km away
                                </motion.span>
                            )}
                    </div>
                    {provider.address && (
                        <p className="mt-1 flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />{" "}
                            {provider.address}
                        </p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            <ShieldCheck className="h-3.5 w-3.5" /> Verified
                            provider
                        </span>
                        {provider.certified_by.map((body) => (
                            <span
                                key={body}
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 transition group-hover:bg-brand-50 group-hover:ring-brand-200"
                            >
                                {body}
                            </span>
                        ))}
                    </div>
                </div>
                <motion.button
                    type="button"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    whileTap={reduce ? undefined : { scale: 0.95 }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition-colors hover:bg-brand-300 sm:self-center"
                >
                    View Profile{" "}
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.25, ease }}
                        className="inline-flex"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </motion.span>
                </motion.button>
            </div>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="profile"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="relative overflow-hidden"
                    >
                        <dl className="mt-5 grid gap-4 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2">
                            {provider.registration_no && (
                                <div>
                                    <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <Building2 className="h-3.5 w-3.5" />{" "}
                                        Registration no.
                                    </dt>
                                    <dd className="mt-1 font-semibold text-ink-900">
                                        {provider.registration_no}
                                    </dd>
                                </div>
                            )}
                            {provider.contact && (
                                <div>
                                    <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <Phone className="h-3.5 w-3.5" /> Phone
                                    </dt>
                                    <dd className="mt-1 font-semibold text-ink-900">
                                        <a href={`tel:${provider.contact}`}>
                                            {provider.contact}
                                        </a>
                                    </dd>
                                </div>
                            )}
                            {provider.email && (
                                <div>
                                    <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <Mail className="h-3.5 w-3.5" /> Email
                                    </dt>
                                    <dd className="mt-1 font-semibold text-ink-900">
                                        <a href={`mailto:${provider.email}`}>
                                            {provider.email}
                                        </a>
                                    </dd>
                                </div>
                            )}
                            {!hasContact && !provider.registration_no && (
                                <p className="text-gray-500">
                                    This provider has not added more details
                                    yet.
                                </p>
                            )}
                        </dl>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
}

function HeroPin({ className, delay = 0, reduce }) {
    return (
        <motion.span
            aria-hidden="true"
            className={`absolute hidden h-11 w-11 items-center justify-center rounded-full bg-brand-400 text-ink-900 shadow-lg shadow-brand-400/30 lg:flex ${className}`}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={
                reduce
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 1, scale: 1, y: [0, -10, 0] }
            }
            transition={{
                opacity: { duration: 0.5, delay: 0.8 + delay },
                scale: { type: "spring", stiffness: 300, damping: 14, delay: 0.8 + delay },
                y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay },
            }}
        >
            {!reduce && (
                <motion.span
                    className="absolute inset-0 rounded-full bg-brand-400"
                    animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay }}
                />
            )}
            <MapPin className="relative h-5 w-5" />
        </motion.span>
    );
}

export default function TrainingProviders({ providers, filters, states = [] }) {
    const reduce = useReducedMotion();
    const [q, setQ] = useState(filters.q);
    const [state, setState] = useState(filters.state);
    const [sort, setSort] = useState(filters.sort);
    const [locating, setLocating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locationError, setLocationError] = useState("");
    const near = filters.lat !== null && filters.lat !== undefined;

    useEffect(() => {
        const off = [
            router.on("start", () => setLoading(true)),
            router.on("finish", () => setLoading(false)),
        ];
        return () => off.forEach((remove) => remove());
    }, []);

    const go = (next = {}) =>
        router.get(
            "/training-providers",
            {
                q,
                state,
                sort,
                lat: filters.lat ?? "",
                lng: filters.lng ?? "",
                ...next,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    const total = providers.total;

    const useMyLocation = () => {
        setLocationError("");
        if (!navigator.geolocation) {
            setLocationError("Your browser does not support location.");
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocating(false);
                setSort("nearest");
                go({
                    lat: position.coords.latitude.toFixed(6),
                    lng: position.coords.longitude.toFixed(6),
                    sort: "nearest",
                    page: 1,
                });
            },
            () => {
                setLocating(false);
                setLocationError(
                    "Location is blocked. Allow location access in your browser, or search by state instead.",
                );
            },
            { timeout: 10000 },
        );
    };
    const clearLocation = () => {
        setSort("name");
        go({ lat: "", lng: "", sort: "name", page: 1 });
    };

    const rise = (delay = 0) => ({
        initial: { opacity: 0, y: reduce ? 0 : 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease, delay },
    });
    const titleWords = [
        { text: "Find", accent: false },
        { text: "My", accent: false },
        { text: "Training", accent: true },
        { text: "Provider", accent: true },
    ];

    return (
        <>
            <Head title="Find My Training Provider · Safety Buddy" />
            <div className="min-h-screen bg-[#F8F8F5] text-ink-900">
                <PublicNavbar current="Training Provider" />

                <section
                    className="relative overflow-hidden text-white"
                    style={{ backgroundColor: "#12171E" }}
                >
                    <motion.img
                        src="/images/training-provider-banner.webp"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover object-[75%_45%]"
                        initial={{ scale: reduce ? 1 : 1.12 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 2.4, ease }}
                    />
                    <div
                        className="absolute inset-0"
                        aria-hidden="true"
                        style={{
                            backgroundImage:
                                "linear-gradient(90deg, rgba(18,23,30,.92) 0%, rgba(18,23,30,.72) 35%, rgba(18,23,30,.12) 60%, rgba(18,23,30,0) 100%)",
                        }}
                    />
                    {!reduce && (
                        <motion.div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-400/25 blur-3xl"
                            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        />
                    )}
                    <HeroPin className="right-[14%] top-[22%]" reduce={reduce} />
                    <HeroPin className="right-[32%] top-[58%]" delay={0.9} reduce={reduce} />
                    <HeroPin className="right-[6%] top-[52%]" delay={1.7} reduce={reduce} />

                    <div className="relative mx-auto max-w-[1200px] px-5 pb-32 pt-16 sm:px-8">
                        <motion.p
                            {...rise(0.05)}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.25em] text-brand-400"
                        >
                            <span className="h-px w-8 bg-brand-400" /> Training Provider
                        </motion.p>
                        <h1 className="mt-3 flex flex-wrap gap-x-3 text-4xl font-black tracking-tight sm:text-5xl">
                            {titleWords.map((word, i) => (
                                <span key={word.text} className="overflow-hidden pb-1">
                                    <motion.span
                                        className={`inline-block ${word.accent ? "text-brand-400" : ""}`}
                                        initial={{ y: reduce ? 0 : "110%", opacity: reduce ? 0 : 1 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.75, ease, delay: 0.15 + i * 0.1 }}
                                    >
                                        {word.text}
                                    </motion.span>
                                </span>
                            ))}
                        </h1>
                        <motion.p
                            {...rise(0.6)}
                            className="mt-4 max-w-2xl text-base leading-7 text-white/75"
                        >
                            Search for registered training providers that
                            deliver safety training through Safety Buddy. Choose
                            a provider and get the training you need for your
                            projects.
                        </motion.p>
                        <motion.div
                            {...rise(0.8)}
                            className="mt-7 flex flex-wrap gap-3 text-sm"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold backdrop-blur ring-1 ring-white/15">
                                <ShieldCheck className="h-4 w-4 text-brand-400" />
                                <b className="text-brand-400"><CountUp value={total} reduce={reduce} /></b>{" "}
                                verified {total === 1 ? "provider" : "providers"}
                            </span>
                            {states.length > 0 && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold backdrop-blur ring-1 ring-white/15">
                                    <MapPin className="h-4 w-4 text-brand-400" />
                                    <b className="text-brand-400"><CountUp value={states.length} reduce={reduce} /></b>{" "}
                                    {states.length === 1 ? "state" : "states"} covered
                                </span>
                            )}
                        </motion.div>
                    </div>
                </section>

                <div className="relative z-10 mx-auto -mt-16 max-w-[1200px] px-5 sm:px-8">
                    <motion.form
                        onSubmit={(event) => {
                            event.preventDefault();
                            go({ page: 1 });
                        }}
                        initial={{ opacity: 0, y: reduce ? 0 : 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.9 }}
                        className="grid gap-4 rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 md:grid-cols-[1.4fr_1fr_auto_auto] md:items-end"
                    >
                        <label className="text-sm font-bold">
                            Search area or name
                            <span className="relative mt-2 block">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={q}
                                    onChange={(event) => setQ(event.target.value)}
                                    placeholder="Enter provider name, town or postcode"
                                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm font-normal transition focus:border-brand-500 focus:ring-4 focus:ring-brand-400/25"
                                />
                            </span>
                        </label>
                        <label className="text-sm font-bold">
                            Search by state
                            <select
                                value={state}
                                onChange={(event) =>
                                    setState(event.target.value)
                                }
                                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-normal transition focus:border-brand-500 focus:ring-4 focus:ring-brand-400/25"
                            >
                                <option value="">All states</option>
                                {states.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="text-sm font-bold">
                            Near me
                            <motion.button
                                type="button"
                                onClick={near ? clearLocation : useMyLocation}
                                disabled={locating}
                                whileTap={reduce ? undefined : { scale: 0.96 }}
                                className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-bold text-ink-900 transition-colors hover:bg-brand-300 disabled:opacity-60"
                            >
                                {!near && !locating && !reduce && (
                                    <motion.span
                                        aria-hidden="true"
                                        className="absolute inset-0 rounded-lg ring-2 ring-brand-400"
                                        animate={{ scale: [1, 1.12], opacity: [0.7, 0] }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                                    />
                                )}
                                {locating ? (
                                    <LoaderCircle className="relative h-4 w-4 animate-spin" />
                                ) : (
                                    <LocateFixed className="relative h-4 w-4" />
                                )}
                                <span className="relative">
                                    {locating
                                        ? "Finding you…"
                                        : near
                                          ? "Clear my location"
                                          : "Use my location"}
                                </span>
                            </motion.button>
                        </div>
                        <motion.button
                            whileTap={reduce ? undefined : { scale: 0.96 }}
                            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-ink-900 px-8 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink-800"
                        >
                            <Search className="h-4 w-4" /> Search
                            <ArrowRight className="-ml-2 h-4 w-0 opacity-0 transition-all duration-200 group-hover:ml-0 group-hover:w-4 group-hover:opacity-100" />
                        </motion.button>
                    </motion.form>

                    <AnimatePresence>
                        {locationError && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 overflow-hidden text-sm text-rose-600"
                                role="alert"
                            >
                                {locationError}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="flex items-center text-xl font-extrabold">
                            <span className="mr-2 text-3xl font-black text-brand-700">
                                <CountUp value={total} reduce={reduce} />
                            </span>
                            Training {total === 1 ? "Provider" : "Providers"}{" "}
                            found{filters.state ? ` in ${filters.state}` : ""}
                            {loading && (
                                <LoaderCircle className="ml-3 h-5 w-5 animate-spin text-brand-700" />
                            )}
                        </h2>
                        <label className="flex items-center gap-2 text-sm text-gray-500">
                            Sort by
                            <select
                                value={sort}
                                onChange={(event) => {
                                    setSort(event.target.value);
                                    go({ sort: event.target.value, page: 1 });
                                }}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink-900 transition focus:border-brand-500 focus:ring-4 focus:ring-brand-400/25"
                            >
                                {near && (
                                    <option value="nearest">
                                        Nearest location
                                    </option>
                                )}
                                <option value="name">Name (A–Z)</option>
                                <option value="newest">Newest</option>
                            </select>
                        </label>
                    </div>

                    <div
                        className={`mt-5 grid gap-4 transition-opacity duration-200 ${loading ? "opacity-60" : "opacity-100"}`}
                    >
                        <AnimatePresence mode="popLayout" initial>
                            {providers.data.map((provider, index) => (
                                <ProviderCard
                                    key={provider.id}
                                    provider={provider}
                                    index={index}
                                    reduce={reduce}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                    {!providers.data.length && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500"
                        >
                            <motion.span
                                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700"
                                animate={reduce ? undefined : { y: [0, -8, 0] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <MapPin className="h-6 w-6" />
                            </motion.span>
                            No training providers match your search yet.
                        </motion.div>
                    )}

                    {providers.last_page > 1 && (
                        <nav
                            aria-label="Pages"
                            className="mt-8 flex flex-wrap justify-center gap-2 pb-16"
                        >
                            {providers.links.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveScroll
                                        className={`min-w-10 rounded-lg border px-3 py-2 text-center text-sm font-semibold transition hover:-translate-y-0.5 ${link.active ? "border-brand-400 bg-brand-400" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        className="min-w-10 rounded-lg border border-gray-100 px-3 py-2 text-center text-sm text-gray-300"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ),
                            )}
                        </nav>
                    )}
                </div>

                <PublicFooter />
            </div>
        </>
    );
}
