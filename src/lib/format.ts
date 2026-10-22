import type { ApplicationStatus } from "./types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export const formatCurrency = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === "" ? "—" : currency.format(Number(value));

export const formatDateTime = (value: string | null | undefined) => (value ? dateTime.format(new Date(value)) : "—");
export const formatDate = (value: string | null | undefined) => (value ? dateOnly.format(new Date(value)) : "—");

/** "debt_consolidation" -> "Debt consolidation" */
export function humanize(value: string | null | undefined) {
  if (!value) return "—";
  const text = value.replace(/[_-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  received: "Received",
  approved: "Approved",
  declined: "Declined",
  withdrawn: "Withdrawn",
  funded: "Funded",
};

export function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
