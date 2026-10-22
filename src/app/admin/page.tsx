"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ErrorBanner, LoadingBlock, PageHeader, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { APPLICATION_STATUSES, type DashboardStats } from "@/lib/types";

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<DashboardStats>("/admin/dashboard/stats")
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={stats ? `Updated ${formatDateTime(stats.generatedAt)}` : "Overview of loan applications"}
        actions={
          <button type="button" className="btn btn-secondary" onClick={load}>
            Refresh
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {!stats && !error && <LoadingBlock />}

      {stats && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total applications" value={stats.totalApplications} />
            <StatCard label="Today" value={stats.submitted.today} hint="Submitted today" />
            <StatCard label="Last 7 days" value={stats.submitted.last7Days} />
            <StatCard label="Last 30 days" value={stats.submitted.last30Days} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="card overflow-hidden lg:col-span-2">
              <h2 className="border-b border-slate-100 px-5 py-4 text-sm font-bold uppercase tracking-wider text-slate-500">
                By status
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Count</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Requested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {APPLICATION_STATUSES.map((status) => (
                    <tr key={status} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/applications?status=${status}`}>
                          <StatusBadge status={status} />
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{stats.byStatus[status] ?? 0}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                        {formatCurrency(stats.requestedAmountByStatus[status] ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="card p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Email delivery</h2>
              <dl className="space-y-3 text-sm">
                {(["sent", "queued", "sending", "failed"] as const).map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <dt className="capitalize text-slate-600">{key}</dt>
                    <dd className={`font-bold tabular-nums ${key === "failed" && stats.emailDelivery.failed > 0 ? "text-rose-600" : "text-navy"}`}>
                      {stats.emailDelivery[key]}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link href="/admin/applications" className="btn btn-primary mt-6 w-full">
                View applications
              </Link>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
