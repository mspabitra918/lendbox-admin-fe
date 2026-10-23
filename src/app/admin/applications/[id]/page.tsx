"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ErrorBanner,
  Field,
  LoadingBlock,
  PageHeader,
  Pill,
  Section,
  StatusBadge,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  display,
  formatCurrency,
  formatDate,
  formatDateTime,
  humanize,
} from "@/lib/format";
import type { Agreement, ApplicationDetail, HistoryEntry } from "@/lib/types";
import { AgreementsPanel } from "./AgreementsPanel";
import { SensitivePanel } from "./SensitivePanel";
import { StatusPanel } from "./StatusPanel";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { admin } = useAuth();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [error, setError] = useState<{
    message: string;
    status: number;
  } | null>(null);

  const load = useCallback(() => {
    const base = `/admin/applications/${encodeURIComponent(id)}`;
    return Promise.all([
      api.get<ApplicationDetail>(base),
      api.get<HistoryEntry[]>(`${base}/history`),
      api.get<Agreement[]>(`${base}/agreements`),
    ])
      .then(([detail, hist, agr]) => {
        setError(null);
        setApp(detail);
        setHistory(hist);
        setAgreements(agr);
      })
      .catch((err: Error) => {
        setError({
          message: err.message,
          status: err instanceof ApiError ? err.status : 0,
        });
      });
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !app) {
    return (
      <>
        <BackLink />
        <ErrorBanner
          message={
            error.status === 404
              ? `Application ${id} was not found.`
              : error.message
          }
          onRetry={error.status === 404 ? undefined : load}
        />
      </>
    );
  }
  if (!app) return <LoadingBlock />;

  const { personal: p, employment: e, banking: b, consent: c } = app;

  return (
    <>
      <BackLink />
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {app.applicant.fullName}
            <StatusBadge status={app.status} />
          </span>
        }
        subtitle={
          <>
            <span className="font-semibold text-slate-700">{app.id}</span> ·{" "}
            submitted {formatDateTime(app.submittedAt)}
          </>
        }
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void load()}
          >
            Refresh
          </button>
        }
      />
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error.message} onRetry={load} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Loan request">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Amount"
                value={
                  <span className="text-lg font-extrabold text-navy">
                    {formatCurrency(app.loan.amount)}
                  </span>
                }
              />
              <Field label="Purpose" value={humanize(app.loan.purpose)} />
              {app.loan.otherPurpose && (
                <Field label="Other purpose" value={app.loan.otherPurpose} />
              )}
            </dl>
          </Section>

          <Section title="Personal">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Name"
                value={`${display(p.firstName)} ${display(p.lastName)}`}
              />
              <Field
                label="Email"
                value={
                  p.email ? (
                    <a
                      className="text-brand hover:underline"
                      href={`mailto:${p.email}`}
                    >
                      {p.email}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="Phone"
                value={
                  p.phone ? (
                    <a
                      className="text-brand hover:underline"
                      href={`tel:${p.phone}`}
                    >
                      {p.phone}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="Date of birth"
                value={
                  p.dobYear ? `${p.dobMonth}/${p.dobDay}/${p.dobYear}` : "—"
                }
              />
              <Field
                label="SSN"
                value={p.ssnLast4 ? `•••-••-${p.ssnLast4}` : "—"}
              />
              <Field
                label="Driver's license state"
                value={display(p.dlState)}
              />
              <Field
                label="Address"
                value={
                  <>
                    {display(p.streetAddress)}
                    {p.addressLine2 && <>, {p.addressLine2}</>}
                    <br />
                    {display(p.city)}, {display(p.state)} {display(p.zip)}
                  </>
                }
              />
              <Field
                label="Years at address"
                value={display(p.yearsAtAddress)}
              />
              <Field
                label="Housing"
                value={`${humanize(p.housingStatus as string)} · ${formatCurrency(p.monthlyHousingCost)}/mo`}
              />
            </dl>
          </Section>

          <Section title="Employment & income">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Field label="Status" value={humanize(e.employmentStatus)} />
              <Field label="Employer" value={display(e.employerName)} />
              <Field label="Job title" value={display(e.jobTitle)} />
              <Field
                label="Time employed"
                value={
                  e.employmentLengthMo ? `${e.employmentLengthMo} months` : "—"
                }
              />
              <Field label="Employer phone" value={display(e.employerPhone)} />
              <Field label="Income source" value={humanize(e.incomeSource)} />
              <Field
                label="Net monthly income"
                value={formatCurrency(e.netMonthlyIncome)}
              />
              <Field label="Pay frequency" value={humanize(e.payFrequency)} />
              <Field
                label="Next pay date"
                value={e.nextPayDate ? formatDate(e.nextPayDate) : "—"}
              />
            </dl>
          </Section>

          <Section title="Banking">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Field label="Bank" value={display(b.bankName)} />
              <Field label="Account type" value={humanize(b.accountType)} />
              <Field
                label="Account"
                value={b.accountLast4 ? `••••${b.accountLast4}` : "—"}
              />
              <Field label="Account age" value={humanize(b.accountAge)} />
              <Field
                label="Balance band"
                value={humanize(b.currentBalanceBand)}
              />
              <Field
                label="Direct deposit"
                value={
                  typeof b.directDeposit === "boolean"
                    ? display(b.directDeposit)
                    : humanize(b.directDeposit)
                }
              />
            </dl>
          </Section>

          {admin?.role === "super_admin" && (
            <SensitivePanel applicationId={app.id} />
          )}

          <AgreementsPanel app={app} agreements={agreements} onChanged={load} />

          <Section title="Status history">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No history yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-slate-200 pl-5">
                {history.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-6.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-brand ring-1 ring-brand/30" />
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {h.fromStatus && (
                        <>
                          <StatusBadge status={h.fromStatus} />
                          <span className="text-slate-400">→</span>
                        </>
                      )}
                      <StatusBadge status={h.toStatus} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(h.createdAt)} ·{" "}
                      {h.admin?.name ?? h.admin?.email ?? humanize(h.actorType)}
                    </p>
                    {h.reason && (
                      <p className="mt-1 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {h.reason}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <StatusPanel app={app} onChanged={load} />

          <Section title="Consent">
            <ul className="space-y-2 text-sm">
              {(
                [
                  ["esign", "E-sign"],
                  ["privacy", "Privacy policy"],
                  ["creditPull", "Credit pull"],
                  ["tcpa", "TCPA contact"],
                ] as const
              ).map(([key, label]) => (
                <li key={key} className="flex items-center justify-between">
                  <span className="text-slate-600">{label}</span>
                  <Pill tone={c[key] ? "green" : "red"}>
                    {c[key] ? "Given" : "Not given"}
                  </Pill>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Consented {formatDateTime(c.consentedAt)}
            </p>
          </Section>

          <Section title="Emails">
            {!app.notifications?.length ? (
              <p className="text-sm text-slate-500">No emails sent.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {app.notifications.map((n) => (
                  <li key={n.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">
                        {humanize(n.template)}
                      </span>
                      <Pill
                        tone={
                          n.status === "sent"
                            ? "green"
                            : n.status === "failed"
                              ? "red"
                              : "amber"
                        }
                      >
                        {n.status}
                      </Pill>
                    </div>
                    <p className="text-xs text-slate-500">
                      {n.recipientHint} ·{" "}
                      {formatDateTime(n.sentAt ?? n.createdAt)}
                      {n.attempts > 1 && ` · ${n.attempts} attempts`}
                    </p>
                    {n.lastError && (
                      <p className="mt-1 text-xs text-rose-600">
                        {n.lastError}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Record">
            <dl className="space-y-3">
              <Field
                label="UUID"
                value={<span className="font-mono text-xs">{app.uuid}</span>}
              />
              <Field label="Created" value={formatDateTime(app.createdAt)} />
              <Field
                label="Status changed"
                value={formatDateTime(app.statusChangedAt)}
              />
              <Field label="Updated" value={formatDateTime(app.updatedAt)} />
            </dl>
          </Section>
        </div>
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/applications"
      className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand"
    >
      ← All applications
    </Link>
  );
}
