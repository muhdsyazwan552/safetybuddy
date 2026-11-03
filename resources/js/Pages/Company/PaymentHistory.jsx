import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
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
}) {
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
                        <Link
                            href="/profile#membership"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to membership
                        </Link>
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
                            <h2
                                id="orders-title"
                                className="font-bold text-ink-950"
                            >
                                Orders awaiting payment or review
                            </h2>
                            <p className="mt-1 text-xs text-ink-500">
                                These requests do not have a completed payment
                                record.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="w-44 px-5 py-3"
                                        >
                                            Date
                                        </th>
                                        <th scope="col" className="px-5 py-3">
                                            Description
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-40 px-5 py-3 text-right"
                                        >
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map((order) => (
                                        <tr key={order.key}>
                                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                {dateTime(order.date)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-ink-950">
                                                    {order.title}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                    {order.detail && (
                                                        <span>
                                                            {order.detail}
                                                        </span>
                                                    )}
                                                    <Status
                                                        value={order.status}
                                                    />
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-ink-950">
                                                {underProvider ? "—" : money(order.amount)}
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
                    {payments.data.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="w-44 px-5 py-3"
                                        >
                                            Date
                                        </th>
                                        <th scope="col" className="px-5 py-3">
                                            Description
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-40 px-5 py-3 text-right"
                                        >
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payments.data.map((payment) => (
                                        <tr key={payment.id}>
                                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                {dateTime(payment.date)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-ink-950">
                                                    {description(payment)}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                    {payment.period_start &&
                                                        ![
                                                            "addon_inspector",
                                                            "addon_executor",
                                                            "activation_code_order",
                                                        ].includes(
                                                            payment.payment_type,
                                                        ) && (
                                                            <span>
                                                                {payment.title}
                                                            </span>
                                                        )}
                                                    <span>
                                                        Record #{payment.id}
                                                    </span>
                                                    <Status
                                                        value={payment.status}
                                                    />
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-ink-950">
                                                {payment.cash_flow ===
                                                "cash_out"
                                                    ? "−"
                                                    : ""}
                                                {money(payment.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="px-5 py-12 text-center text-sm text-gray-500">
                            No payment records yet.
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
