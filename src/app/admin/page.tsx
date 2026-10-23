"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ErrorBanner, LoadingBlock, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { APPLICATION_STATUSES, type DashboardStats } from "@/lib/types";

type DateRange = "7d" | "30d" | "90d";

function StatCard({
  label,
  value,
  hint,
  accent = "teal",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "teal" | "amber" | "red" | "blue";
}) {
  const accents = {
    teal: "border-t-teal-600",
    amber: "border-t-amber-500",
    red: "border-t-red-600",
    blue: "border-t-blue-500",
  };

  return (
    <article
      className={`rounded-xl border border-slate-200 border-t-[3px] ${accents[accent]} bg-white p-5`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 12.5 6.5 7h11l2.5 5.5v6H4z" />
          <path d="M4 13h5l1.5 2h3L15 13h5" />
        </svg>
      </div>
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-slate-200 bg-white p-5 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<DashboardStats>("/admin/dashboard/stats");
      setStats(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard statistics.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rangeLabel = {
    "7d": "last 7 days",
    "30d": "last 30 days",
    "90d": "last 90 days",
  }[dateRange];

  const emailTotal = stats
    ? stats.emailDelivery.sent +
      stats.emailDelivery.queued +
      stats.emailDelivery.sending +
      stats.emailDelivery.failed
    : 0;

  const emailItems = stats
    ? [
        {
          key: "sent",
          label: "Sent",
          value: stats.emailDelivery.sent,
          color: "bg-emerald-500",
        },
        {
          key: "sending",
          label: "Sending",
          value: stats.emailDelivery.sending,
          color: "bg-blue-500",
        },
        {
          key: "queued",
          label: "Queued",
          value: stats.emailDelivery.queued,
          color: "bg-amber-400",
        },
        {
          key: "failed",
          label: "Failed",
          value: stats.emailDelivery.failed,
          color: "bg-rose-500",
        },
      ]
    : [];

  return (
    <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 xl:p-7">
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Loan applications · All statuses · {rangeLabel}
            {stats?.generatedAt
              ? ` · Updated ${formatDateTime(stats.generatedAt)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={dateRange === range}
                onClick={() => setDateRange(range)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  dateRange === range
                    ? "bg-teal-700 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" />
            </svg>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="mb-5">
          <ErrorBanner message={error} onRetry={() => void load()} />
        </div>
      ) : null}
      {loading && !stats ? <LoadingBlock /> : null}

      {stats ? (
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total applications"
              value={stats.totalApplications.toLocaleString()}
              hint="All applications received"
              accent="teal"
            />
            <StatCard
              label="Submitted today"
              value={stats.submitted.today.toLocaleString()}
              hint="Applications received today"
              accent="blue"
            />
            <StatCard
              label="Last 7 days"
              value={stats.submitted.last7Days.toLocaleString()}
              hint="Applications submitted"
              accent="amber"
            />
            <StatCard
              label="Last 30 days"
              value={stats.submitted.last30Days.toLocaleString()}
              hint="Applications submitted"
              accent="red"
            />
          </section>

          <Panel title="Applications by status" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Applications
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Requested amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {APPLICATION_STATUSES.map((status) => (
                    <tr key={status} className="transition hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/applications?status=${status}`}
                          className="inline-flex rounded-md outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                        >
                          <StatusBadge status={status} />
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {(stats.byStatus[status] ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                        {formatCurrency(
                          stats.requestedAmountByStatus[status] ?? 0,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <section className="grid gap-5 xl:grid-cols-2">
            <Panel
              title="Application activity"
              action={
                <span className="text-sm text-teal-700">{rangeLabel}</span>
              }
              className="min-h-[250px]"
            >
              <EmptyState
                title="Activity chart not available"
                description="The dashboard stats endpoint does not currently provide daily application totals. Add a time-series API to display the trend here."
              />
            </Panel>

            <Panel
              title="Email delivery"
              action={
                <span className="text-sm text-slate-500">
                  {emailTotal.toLocaleString()} total
                </span>
              }
              className="min-h-[250px]"
            >
              {emailTotal === 0 ? (
                <EmptyState
                  title="No email delivery data yet"
                  description="Email delivery metrics will appear here when the backend returns delivery counts."
                />
              ) : (
                <div className="space-y-5 pt-2">
                  {emailItems.map((item) => {
                    const percentage = emailTotal
                      ? Math.round((item.value / emailTotal) * 100)
                      : 0;
                    return (
                      <div key={item.key} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{item.label}</span>
                          <span
                            className={`font-semibold tabular-nums ${item.key === "failed" && item.value > 0 ? "text-rose-600" : "text-slate-900"}`}
                          >
                            {item.value.toLocaleString()}{" "}
                            <span className="font-normal text-slate-400">
                              ({percentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${item.color} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link
                href="/admin/applications"
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                View applications
              </Link>
            </Panel>
          </section>

          <Panel
            title="Latest applications"
            action={
              <Link
                href="/admin/applications"
                className="text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                All applications
              </Link>
            }
          >
            <EmptyState
              title="Open the application list"
              description="Review, search, and manage individual applications from the applications page."
            />
          </Panel>
        </div>
      ) : null}
    </main>
  );
}
