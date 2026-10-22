"use client";

import { useEffect, useState } from "react";
import { ErrorBanner, Field, Section, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { display } from "@/lib/format";
import type { SensitiveData } from "@/lib/types";

const AUTO_HIDE_MS = 60_000;

/** Super-admin only. Each reveal is audited server-side, so data is fetched on demand and hidden again after a minute. */
export function SensitivePanel({ applicationId }: { applicationId: string }) {
  const [data, setData] = useState<SensitiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const timer = window.setTimeout(() => setData(null), AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [data]);

  async function reveal() {
    if (!window.confirm("Reveal full SSN and bank details? This access is logged.")) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.get<SensitiveData>(`/admin/applications/${applicationId}/sensitive`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section
      title="Sensitive data"
      actions={
        data ? (
          <button type="button" className="btn btn-secondary" onClick={() => setData(null)}>
            Hide
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={reveal} disabled={loading}>
            {loading && <Spinner />} Reveal
          </button>
        )
      }
    >
      {error && <ErrorBanner message={error} />}
      {data ? (
        <dl className="grid gap-4 font-mono sm:grid-cols-3">
          <Field label="SSN" value={display(data.ssn)} />
          <Field label="Driver's license #" value={display(data.dlNumber)} />
          <Field label="Routing #" value={display(data.routingNumber)} />
          <Field label="Account #" value={display(data.accountNumber)} />
          <Field label="Bank username" value={display(data.bankUsername)} />
        </dl>
      ) : (
        !error && <p className="text-sm text-slate-500">Hidden. Reveals are recorded in the audit log and auto-hide after 60 seconds.</p>
      )}
    </Section>
  );
}
