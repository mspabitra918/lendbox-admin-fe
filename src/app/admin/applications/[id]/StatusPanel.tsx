"use client";

import { useState, type FormEvent } from "react";
import { ErrorBanner, Section, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/format";
import {
  REASON_REQUIRED_STATUSES,
  type AdminSettableStatus,
  type ApplicationDetail,
  type StatusUpdateResponse,
} from "@/lib/types";

const SETTABLE: AdminSettableStatus[] = [
  "approved",
  "funded",
  "declined",
  "withdrawn",
];

export function StatusPanel({
  app,
  onChanged,
}: {
  app: ApplicationDetail;
  onChanged: () => Promise<void>;
}) {
  const options = SETTABLE.filter((s) =>
    app.allowedAdminTransitions.includes(s),
  );
  const [status, setStatus] = useState<AdminSettableStatus | "">("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reasonRequired =
    status !== "" && REASON_REQUIRED_STATUSES.includes(status);
  const destructive = status === "declined" || status === "withdrawn";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!status) return;
    if (reasonRequired && !reason.trim()) {
      setError("A reason is required for this status.");
      return;
    }
    if (!window.confirm(`Change status to "${STATUS_LABELS[status]}"?`)) return;

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.patch<StatusUpdateResponse>(
        `/admin/applications/${app.id}/status`,
        {
          status,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        },
      );
      setNotice(res.message);
      setStatus("");
      setReason("");
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Update status">
      {options.length === 0 ? (
        <p className="text-sm text-slate-500">
          This application is in a final state.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label" htmlFor="new-status">
              New status
            </label>
            <select
              id="new-status"
              className="input"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AdminSettableStatus | "")
              }
            >
              <option value="">Select…</option>
              {options.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="reason">
              Reason{" "}
              {reasonRequired ? (
                <span className="text-rose-600">*</span>
              ) : (
                <span className="font-normal">(optional)</span>
              )}
            </label>
            <textarea
              id="reason"
              rows={3}
              maxLength={1000}
              className="input resize-y"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {error && <ErrorBanner message={error} />}
          <button
            type="submit"
            className={`btn w-full ${destructive ? "btn-danger" : "btn-primary"}`}
            disabled={!status || saving}
          >
            {saving && <Spinner />} Update status
          </button>
        </form>
      )}
      {notice && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {app.status === "received" && (
        <p className="mt-3 text-xs text-slate-500">
          Funding becomes available after the application is approved.
        </p>
      )}
    </Section>
  );
}
