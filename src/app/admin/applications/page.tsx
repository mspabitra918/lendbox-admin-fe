"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { ErrorBanner, LoadingBlock, PageHeader, Spinner, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime, humanize, STATUS_LABELS } from "@/lib/format";
import { APPLICATION_STATUSES, type ApplicationSummary, type Paginated } from "@/lib/types";

const FILTER_KEYS = ["q", "status", "submittedFrom", "submittedTo", "minAmount", "maxAmount"] as const;
const SORT_OPTIONS = [
  { value: "submittedAt", label: "Submitted" },
  { value: "statusChangedAt", label: "Status changed" },
  { value: "updatedAt", label: "Updated" },
  { value: "loanAmount", label: "Amount" },
  { value: "lastName", label: "Last name" },
];

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader title="Applications" subtitle="Search, filter and review loan applications" />
      <Suspense fallback={<LoadingBlock />}>
        <ApplicationsTable />
      </Suspense>
    </>
  );
}

function ApplicationsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryString = params.toString();

  const [result, setResult] = useState<Paginated<ApplicationSummary> | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Tracks which query the current result/error belongs to; anything else means a fetch is in flight.
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const requestKey = `${queryString}#${reloadKey}`;
  const loading = settledKey !== requestKey;

  // Form state mirrors the URL so filters survive reloads and are shareable.
  const [form, setForm] = useState<Record<(typeof FILTER_KEYS)[number], string>>(() => readForm(params));
  const [formSource, setFormSource] = useState(queryString);
  if (formSource !== queryString) {
    setFormSource(queryString);
    setForm(readForm(params));
  }

  useEffect(() => {
    const controller = new AbortController();
    const query = Object.fromEntries(new URLSearchParams(queryString));
    api
      .getPage<ApplicationSummary>("/admin/applications", { limit: 20, ...query }, controller.signal)
      .then((res) => {
        setResult(res);
        setError(null);
        setSettledKey(requestKey);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError({ key: requestKey, message: err.message });
        setSettledKey(requestKey);
      });
    return () => controller.abort();
  }, [queryString, requestKey]);

  function navigate(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(queryString);
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    navigate({ ...form, page: undefined });
  }

  const sortBy = params.get("sortBy") ?? "submittedAt";
  const sortOrder = params.get("sortOrder") ?? "desc";
  const hasFilters = FILTER_KEYS.some((key) => params.get(key));

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="q">
            Search
          </label>
          <input
            id="q"
            className="input"
            placeholder="Name, email or application ID"
            value={form.q}
            maxLength={254}
            onChange={(e) => setForm({ ...form, q: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="status">
            Status
          </label>
          <select id="status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="from">
            Submitted from
          </label>
          <input id="from" type="date" className="input" value={form.submittedFrom} onChange={(e) => setForm({ ...form, submittedFrom: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="to">
            Submitted to
          </label>
          <input id="to" type="date" className="input" value={form.submittedTo} onChange={(e) => setForm({ ...form, submittedTo: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="min">
              Min $
            </label>
            <input id="min" type="number" min={0} className="input" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="max">
              Max $
            </label>
            <input id="max" type="number" min={0} className="input" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
          {hasFilters && (
            <button type="button" className="btn btn-secondary" onClick={() => router.push(pathname)}>
              Clear
            </button>
          )}
          <div className="ml-auto flex items-end gap-2">
            <div>
              <label className="label" htmlFor="sortBy">
                Sort by
              </label>
              <select id="sortBy" className="input" value={sortBy} onChange={(e) => navigate({ sortBy: e.target.value, page: undefined })}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              aria-label="Toggle sort order"
              onClick={() => navigate({ sortOrder: sortOrder === "desc" ? "asc" : "desc", page: undefined })}
            >
              {sortOrder === "desc" ? "↓ Desc" : "↑ Asc"}
            </button>
          </div>
        </div>
      </form>

      {error && <ErrorBanner message={error.message} onRetry={() => setReloadKey((k) => k + 1)} />}

      <div className="card relative overflow-hidden">
        {loading && result && (
          <div className="absolute right-4 top-3 text-brand">
            <Spinner />
          </div>
        )}
        {!result && loading ? (
          <LoadingBlock />
        ) : result && result.data.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No applications match these filters.</p>
        ) : result ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-205 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Application</th>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Purpose</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.data.map((app) => (
                  <tr
                    key={app.uuid}
                    className="cursor-pointer hover:bg-brand-50/50"
                    onClick={() => router.push(`/admin/applications/${app.id}`)}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/applications/${app.id}`} className="font-bold text-brand hover:underline" onClick={(e) => e.stopPropagation()}>
                        {app.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{app.applicant.fullName}</p>
                      <p className="text-xs text-slate-500">{app.applicant.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCurrency(app.loan.amount)}</td>
                    <td className="px-4 py-3 text-slate-600">{humanize(app.loan.purpose)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDateTime(app.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {result && result.meta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            {result.meta.total} result{result.meta.total === 1 ? "" : "s"} · page {result.meta.page} of {result.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!result.meta.hasPreviousPage || loading}
              onClick={() => navigate({ page: String(result.meta.page - 1) })}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!result.meta.hasNextPage || loading}
              onClick={() => navigate({ page: String(result.meta.page + 1) })}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function readForm(params: URLSearchParams) {
  return Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) ?? ""])) as Record<(typeof FILTER_KEYS)[number], string>;
}
