export type AdminRole = "super_admin" | "admin";

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  lastLoginAt: string | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  expiresAt: string;
  admin: AdminProfile;
}

export const APPLICATION_STATUSES = [
  "received",
  "approved",
  "declined",
  "withdrawn",
  "funded",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Statuses an admin may set via PATCH /admin/applications/:id/status. */
export type AdminSettableStatus = "approved" | "declined" | "withdrawn" | "funded";
export const REASON_REQUIRED_STATUSES: AdminSettableStatus[] = ["declined", "withdrawn"];

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApplicationSummary {
  id: string;
  uuid: string;
  status: ApplicationStatus;
  applicant: { firstName: string; lastName: string; fullName: string; email: string };
  loan: { amount: number; purpose: string };
  submittedAt: string;
  statusChangedAt: string | null;
  updatedAt: string;
}

export type AgreementStatus = "created" | "sent" | "viewed" | "signed" | "declined" | "expired" | "voided";
export const OPEN_AGREEMENT_STATUSES: AgreementStatus[] = ["created", "sent", "viewed"];

export interface AgreementSummary {
  id: string;
  provider: string;
  status: AgreementStatus;
  sentAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  voidedAt: string | null;
  createdAt: string;
}

export interface Agreement extends AgreementSummary {
  applicationId: string;
  providerReference: string | null;
  documentReference: string | null;
  documentSha256: string | null;
  signedDocumentReference: string | null;
  signerName: string | null;
  signatureEvidence: unknown;
  voidReason: string | null;
  auditTrail?: {
    action: string;
    actorType: string;
    actorId: string | null;
    metadata: Record<string, unknown> | null;
    ip: string | null;
    createdAt: string;
  }[];
}

export interface EmailNotification {
  id: string;
  template: string;
  recipientHint: string;
  status: "queued" | "sending" | "sent" | "failed";
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
}

type Nullable<T> = { [K in keyof T]: T[K] | null };

export interface ApplicationDetail extends ApplicationSummary {
  allowedAdminTransitions: ApplicationStatus[];
  canSendAgreement: boolean;
  loan: { amount: number; purpose: string; otherPurpose: string | null };
  personal: Nullable<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dobMonth: string | number;
    dobDay: string | number;
    dobYear: string | number;
    ssnLast4: string;
    dlState: string;
    streetAddress: string;
    addressLine2: string;
    city: string;
    state: string;
    zip: string;
    yearsAtAddress: string | number;
    housingStatus: string;
    monthlyHousingCost: string | number;
  }>;
  employment: Nullable<{
    employmentStatus: string;
    employerName: string;
    jobTitle: string;
    employmentLengthMo: string | number;
    employerPhone: string;
    payFrequency: string;
    nextPayDate: string;
    netMonthlyIncome: string;
    incomeSource: string;
  }>;
  banking: Nullable<{
    bankName: string;
    accountType: string;
    accountLast4: string;
    accountAge: string;
    currentBalanceBand: string;
    directDeposit: string | boolean;
  }>;
  consent: Nullable<{
    esign: boolean;
    privacy: boolean;
    creditPull: boolean;
    tcpa: boolean;
    consentedAt: string;
  }>;
  createdAt: string;
  agreements?: AgreementSummary[];
  notifications?: EmailNotification[];
}

export interface SensitiveData {
  ssn: string | null;
  dlNumber: string | null;
  routingNumber: string | null;
  accountNumber: string | null;
  bankUsername: string | null;
}

export interface HistoryEntry {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  actorType: "admin" | "submission" | "system";
  admin: { id: string; name?: string; email?: string } | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StatusUpdateResponse {
  changed: boolean;
  previousStatus: ApplicationStatus;
  application: ApplicationDetail;
  message: string;
}

export interface SendAgreementResponse {
  created: boolean;
  message: string;
  applicationStatus: ApplicationStatus;
  agreement: Agreement;
}

type StatusRecord = Record<ApplicationStatus, number>;

export interface DashboardStats {
  totalApplications: number;
  submitted: { today: number; last7Days: number; last30Days: number };
  byStatus: StatusRecord;
  requestedAmountByStatus: StatusRecord;
  emailDelivery: { queued: number; sending: number; sent: number; failed: number };
  generatedAt: string;
}
