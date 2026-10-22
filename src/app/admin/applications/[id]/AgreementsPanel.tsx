"use client";

import { useState } from "react";
import { ErrorBanner, Pill, Section, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, humanize } from "@/lib/format";
import { OPEN_AGREEMENT_STATUSES, type Agreement, type AgreementStatus, type ApplicationDetail, type SendAgreementResponse } from "@/lib/types";

const TONE: Record<AgreementStatus, "slate" | "green" | "amber" | "red" | "blue"> = {
  created: "slate",
  sent: "blue",
  viewed: "amber",
  signed: "green",
  declined: "red",
  expired: "slate",
  voided: "slate",
};

export function AgreementsPanel({
  app,
  agreements,
  onChanged,
}: {
  app: ApplicationDetail;
  agreements: Agreement[];
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const hasOpen = agreements.some((a) => OPEN_AGREEMENT_STATUSES.includes(a.status));

  async function run(key: string, action: () => Promise<string>) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      setNotice(await action());
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function send(resend: boolean) {
    const message = resend
      ? "Void the current agreement and send a new signing link to the applicant?"
      : "Send the loan agreement to the applicant for signature?";
    if (!window.confirm(message)) return;
    void run(resend ? "resend" : "send", async () => {
      const res = await api.post<SendAgreementResponse>(`/admin/applications/${app.id}/send-agreement`, resend ? { resend: true } : {});
      return res.message;
    });
  }

  function voidAgreement(agreement: Agreement) {
    const reason = window.prompt("Reason for voiding this agreement (min 3 characters):")?.trim();
    if (!reason) return;
    if (reason.length < 3) {
      setError("Void reason must be at least 3 characters.");
      return;
    }
    void run(agreement.id, async () => {
      await api.post(`/admin/agreements/${agreement.id}/void`, { reason });
      return "Agreement voided.";
    });
  }

  return (
    <Section
      title="Loan agreement"
      actions={
        app.canSendAgreement && (
          <div className="flex gap-2">
            {hasOpen ? (
              <button type="button" className="btn btn-secondary" disabled={busy !== null} onClick={() => send(true)}>
                {busy === "resend" && <Spinner />} Resend
              </button>
            ) : (
              <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => send(false)}>
                {busy === "send" && <Spinner />} Send agreement
              </button>
            )}
          </div>
        )
      }
    >
      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} />
        </div>
      )}
      {notice && <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      {agreements.length === 0 ? (
        <p className="text-sm text-slate-500">
          {app.canSendAgreement ? "No agreement sent yet." : "Agreements can only be sent while the application is received or approved."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {agreements.map((a) => {
            const open = OPEN_AGREEMENT_STATUSES.includes(a.status);
            return (
              <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Pill tone={TONE[a.status]}>{a.status}</Pill>
                    <span className="text-sm text-slate-600">{humanize(a.provider)}</span>
                  </div>
                  <div className="flex gap-2">
                    {a.auditTrail && a.auditTrail.length > 0 && (
                      <button type="button" className="text-xs font-semibold text-brand hover:underline" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                        {expanded === a.id ? "Hide" : "Audit trail"}
                      </button>
                    )}
                    {open && (
                      <button type="button" className="text-xs font-semibold text-rose-600 hover:underline" disabled={busy !== null} onClick={() => voidAgreement(a)}>
                        {busy === a.id ? "Voiding…" : "Void"}
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Sent {formatDateTime(a.sentAt)}
                  {a.viewedAt && ` · viewed ${formatDateTime(a.viewedAt)}`}
                  {a.signedAt && ` · signed ${formatDateTime(a.signedAt)}`}
                  {open && a.expiresAt && ` · expires ${formatDateTime(a.expiresAt)}`}
                  {a.voidedAt && ` · voided ${formatDateTime(a.voidedAt)}`}
                </p>
                {a.signerName && <p className="mt-1 text-xs text-slate-600">Signed by {a.signerName}</p>}
                {a.voidReason && <p className="mt-1 text-xs text-slate-600">Void reason: {a.voidReason}</p>}
                {expanded === a.id && a.auditTrail && (
                  <ul className="mt-2 space-y-1 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                    {a.auditTrail.map((t, i) => (
                      <li key={i}>
                        <span className="font-medium text-slate-800">{humanize(t.action)}</span> · {humanize(t.actorType)} · {formatDateTime(t.createdAt)}
                        {t.ip && ` · ${t.ip}`}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
