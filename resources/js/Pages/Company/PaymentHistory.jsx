import BackLink from '@/Components/shared/BackLink';
import React, { useEffect, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import TableToolbar, { ToolbarSelect } from "@/Components/shared/TableToolbar";
import { ArrowLeft, FileText, MessageCircle } from "lucide-react";
import AccountPageLayout from "@/Layouts/AccountPageLayout";

const money = (value) =>
    `RM ${Number(value).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (value) =>
    value
        ? new Date(value.replace(" ", "T")).toLocaleString("en-MY", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
          })
        : "—";
const date = (value) =>
    value
        ? new Date(`${value}T00:00:00`).toLocaleDateString("en-MY", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "—";
const shortDate = (value) =>
    value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-GB") : "—";
const description = (payment) => {
    const membership =
        payment.period_start &&
        payment.period_end &&
        ![
            "addon_inspector",
            "addon_executor",
            "activation_code_order",
        ].includes(payment.payment_type);
    return membership
        ? `Membership for ${shortDate(payment.period_start)}–${shortDate(payment.period_end)}`
        : [payment.title, payment.detail].filter(Boolean).join(" · ");
};

function Status({ value }) {
    const styles = {
        completed: "bg-emerald-50 text-emerald-700",
        pending: "bg-brand-100 text-ink-900",
        failed: "bg-rose-50 text-rose-700",
        rejected: "bg-rose-50 text-rose-700",
    };
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[value] || "bg-gray-100 text-gray-600"}`}
        >
            {value || "Unknown"}
        </span>
    );
}

export default function PaymentHistory({
    payments,
    orders = [],
    yearlyPayment = null,
    underProvider = false,
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const firstRun = useRef(true);
    const go = (next) => {
        const data = { ...(next.search ? { search: next.search } : {}), ...(next.status ? { status: next.status } : {}) };
        router.get("/manage-package/payments", data, { preserveScroll: true, preserveState: true, replace: true });
    };
    useEffect(() => {
        if (firstRun.current) { firstRun.current = false; return; }
        const timer = setTimeout(() => go({ search: search.trim(), status }), 350);
        return () => clearTimeout(timer);
    }, [search, status]);
    return (
        <AccountPageLayout>
            <Head title="Payment history" />
            <div className="mx-auto max-w-6xl space-y-6">
                <div>
                    <p className="text-xs font-black uppercase tracking-[.18em] text-brand-800">
                        Your company
                    </p>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
                        <h1 className="text-3xl font-black tracking-tight text-ink-950">
                            Payment history
                        </h1>
                        <BackLink
                            href="/profile#membership"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </BackLink>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        Package payments, extra slots, and Training Provider
                        orders recorded for your company.
                    </p>
                </div>

                <section
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    aria-labelledby="yearly-payment-title"
                >
                    <div className="h-1 bg-brand-500" />
                    <div className="flex flex-wrap items-start justify-between gap-5 p-5 sm:p-6">
                        <div>
                            <h2
                                id="yearly-payment-title"
                                className="text-lg font-bold text-ink-950"
                            >
                                Your Yearly payment
                            </h2>
                            {yearlyPayment ? (
                                <>
                                    <p className="mt-3 text-xl font-bold text-ink-950">
                                        {yearlyPayment.package_name}
                                    </p>
                                    <p className="mt-4 text-sm text-gray-700">
                                        Your package is valid until{" "}
                                        <strong className="text-ink-950">
                                            {date(yearlyPayment.end_date)}
                                        </strong>
                                        . Renew by this date to keep access.
                                    </p>
                                </>
                            ) : (
                                <p className="mt-3 text-sm text-gray-500">
                                    No active yearly membership is recorded.
                                </p>
                            )}
                        </div>
                        {yearlyPayment && !underProvider && (
                            <div className="rounded-xl bg-brand-50 px-5 py-4 sm:text-right">
                                <p className="text-xs font-bold uppercase tracking-wider text-ink-600">
                                    Total package
                                </p>
                                <p className="mt-1 text-2xl font-black text-ink-950">
                                    {yearlyPayment.total === null
                                        ? "—"
                                        : money(yearlyPayment.total)}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {orders.length > 0 && (
                    <section
                        className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm"
                        aria-labelledby="orders-title"
                    >
                        <div className="border-b border-brand-100 bg-brand-50 px-5 py-4">
                            <h2 id="orders-title" className="font-bold text-ink-950">
                                Orders awaiting payment or review
                            </h2>
                            <p className="mt-1 text-xs text-ink-500">
                                These orders do not have a completed payment record yet. For a pending order, tap Pay by WhatsApp to send us the order details.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="bg-ink-950 text-xs font-bold uppercase tracking-wider text-brand-400">
                                    <tr>
                                        <th scope="col" className="px-5 py-3">Date</th>
                                        <th scope="col" className="px-5 py-3">Order no.</th>
                                        <th scope="col" className="px-5 py-3">Description</th>
                                        <th scope="col" className="px-5 py-3">Status</th>
                                        <th scope="col" className="px-5 py-3 text-right">Total</th>
                                        <th scope="col" className="px-5 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map((order) => (
                                        <tr key={order.key} className="align-top">
                                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">{dateTime(order.date)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 font-bold text-ink-950">{order.order_no || "—"}</td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-ink-950">{order.title}</p>
                                                {order.detail && <p className="mt-1 text-xs font-medium text-gray-700">{order.detail}</p>}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4"><Status value={order.status} /></td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-ink-950">
                                                {underProvider ? "—" : money(order.amount)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right">
                                                {order.status === "pending" && order.order_no ? (
                                                    <a
                                                        href={`https://wa.me/60168865619?text=${encodeURIComponent(`Hello Safety Buddy, I would like to make payment for my order.
Order number: ${order.order_no}
Item: ${order.title}${order.detail ? ` (${order.detail})` : ""}
Amount: ${money(order.amount)}`)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-400 px-3 py-1.5 text-xs font-black text-ink-950 hover:bg-brand-300"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" /> Pay by WhatsApp
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                <section
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    aria-labelledby="transactions-title"
                >
                    <div className="border-b border-gray-100 px-5 py-4">
                        <h2
                            id="transactions-title"
                            className="font-bold text-ink-950"
                        >
                            Recorded transactions
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Includes completed, pending, and failed payment
                            records.
                        </p>
                    </div>
                    <TableToolbar search={search} onSearch={setSearch} placeholder="Search order no., package or record no…" count={payments.total} onClear={(search || status) ? () => { setSearch(""); setStatus(""); } : null}>
                        <ToolbarSelect label="Status" value={status} onChange={setStatus}>
                            <option value="">All statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </ToolbarSelect>
                    </TableToolbar>
                    {payments.data.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="bg-ink-950 text-xs font-bold uppercase tracking-wider text-brand-400">
                                    <tr>
                                        <th scope="col" className="px-5 py-3">Date</th>
                                        <th scope="col" className="px-5 py-3">Order no.</th>
                                        <th scope="col" className="px-5 py-3">Description</th>
                                        <th scope="col" className="px-5 py-3">Status</th>
                                        <th scope="col" className="px-5 py-3 text-right">Total</th>
                                        <th scope="col" className="px-5 py-3 text-right">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payments.data.map((payment) => (
                                        <tr key={payment.id} className="align-top">
                                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">{dateTime(payment.date)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 font-bold text-ink-950">{payment.order_no || "—"}</td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-ink-950">{description(payment)}</p>
                                                <p className="mt-1 text-xs font-medium text-gray-700">
                                                    {[
                                                        payment.period_start && !["addon_inspector", "addon_executor", "activation_code_order"].includes(payment.payment_type) ? payment.title : null,
                                                        `Record #${payment.id}`,
                                                    ].filter(Boolean).join(" · ")}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4"><Status value={payment.status} /></td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-ink-950">
                                                {payment.cash_flow === "cash_out" ? "−" : ""}
                                                {money(payment.amount)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right">
                                                {payment.receipt_no ? (
                                                    <a href={`/manage-package/payments/${payment.id}/receipt`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-ink-900 hover:border-brand-400 hover:bg-brand-50">
                                                        <FileText className="h-3.5 w-3.5" /> {payment.receipt_no}
                                                    </a>
                                                ) : (
                                                    <span className="text-xs font-medium text-gray-600">After approval</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="px-5 py-12 text-center text-sm text-gray-500">
                            {search || status ? "No payments match your search." : "No payment records yet."}
                        </p>
                    )}
                    {payments.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-sm">
                            <span className="text-gray-500">
                                Page {payments.current_page} of{" "}
                                {payments.last_page}
                            </span>
                            <div className="flex gap-2">
                                {payments.prev_page_url && (
                                    <Link
                                        href={payments.prev_page_url}
                                        className="rounded-lg border border-gray-200 px-3 py-2 font-semibold text-ink-900 hover:bg-gray-50"
                                    >
                                        Previous
                                    </Link>
                                )}
                                {payments.next_page_url && (
                                    <Link
                                        href={payments.next_page_url}
                                        className="rounded-lg border border-gray-200 px-3 py-2 font-semibold text-ink-900 hover:bg-gray-50"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </section>
                <p className="text-xs text-gray-500">
                    Packages paid for by a Training Provider appear on the
                    package card; they are not charged to your company.
                </p>
            </div>
        </AccountPageLayout>
    );
}
