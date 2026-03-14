// =============================================================================
// SplitSend Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Enums (mirror Supabase enum types)
// -----------------------------------------------------------------------------

export type ProfessionType =
  | "pharmacist"
  | "nurse"
  | "doctor"
  | "student"
  | "engineer"
  | "lawyer"
  | "other_professional"
  | "general_applicant";

export type RequestCategory =
  | "pebc"
  | "wes"
  | "transcript"
  | "licensing_body"
  | "school_admission"
  | "embassy_immigration"
  | "general_courier"
  | "other";

export type CourierPreference = "dhl" | "ups" | "fedex" | "any";

export type RequestStatus = "active" | "matched" | "completed" | "cancelled" | "suspended";

export type MatchStatus =
  | "pending"
  | "initiator_paid"
  | "partner_paid"
  | "both_paid"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "success" | "failed" | "abandoned";

export type NotificationType =
  | "connection_request"
  | "payment_received"
  | "both_paid"
  | "contact_revealed"
  | "match_completed"
  | "issue_reported"
  | "system";

export type ReportReason =
  | "fake_listing"
  | "spam"
  | "abusive_behavior"
  | "wrong_info"
  | "suspicious_activity"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export type AdminActionType =
  | "suspend_user"
  | "unsuspend_user"
  | "delete_request"
  | "resolve_report"
  | "close_match"
  | "review_payment";

export type UserRole = "user" | "admin";

// -----------------------------------------------------------------------------
// Database Row Types
// -----------------------------------------------------------------------------

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  whatsapp_number: string | null;
  profession: ProfessionType | null;
  state: string | null;
  city: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** Public-safe request fields (never includes private contact details) */
export interface PublicRequest {
  id: string;
  user_id: string;
  first_name: string;
  profession: ProfessionType;
  request_category: RequestCategory;
  state: string;
  city: string;
  area: string | null;
  courier_preference: CourierPreference;
  destination_country: string;
  destination_institution: string | null;
  document_type: string | null;
  preferred_send_date: string;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
}

/** Full request row — only accessible server-side via service_role */
export interface FullRequest extends PublicRequest {
  full_name_private: string;
  whatsapp_number: string;
  email_private: string | null;
  updated_at: string;
}

export interface Match {
  id: string;
  initiator_request_id: string;
  partner_request_id: string;
  initiator_user_id: string;
  partner_user_id: string;
  status: MatchStatus;
  initiator_contact_revealed: boolean;
  partner_contact_revealed: boolean;
  booking_receipt_path: string | null;
  initiator_paid_at: string | null;
  partner_paid_at: string | null;
  both_paid_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  match_id: string;
  user_id: string;
  paystack_reference: string;
  paystack_access_code: string | null;
  amount_kobo: number;
  currency: string;
  status: PaymentStatus;
  verified_at: string | null;
  gateway_response: string | null;
  channel: string | null;
  ip_address: string | null;
  webhook_processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  request_id: string | null;
  match_id: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: AdminActionType;
  target_user_id: string | null;
  target_request_id: string | null;
  target_report_id: string | null;
  target_match_id: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// API Request/Response Types
// -----------------------------------------------------------------------------

export interface CreateRequestPayload {
  first_name: string;
  profession: ProfessionType;
  request_category: RequestCategory;
  state: string;
  city: string;
  area?: string;
  courier_preference: CourierPreference;
  destination_country: string;
  destination_institution?: string;
  document_type?: string;
  preferred_send_date: string;
  notes?: string;
  full_name_private: string;
  whatsapp_number: string;
  email_private?: string;
}

export interface ConnectPayload {
  partner_request_id: string;
}

export interface VerifyPaymentPayload {
  reference: string;
  match_id: string;
}

export interface ReportPayload {
  reported_user_id?: string;
  request_id?: string;
  match_id?: string;
  reason: ReportReason;
  description?: string;
}

// Contact details revealed after both payments verified
export interface RevealedContact {
  full_name: string;
  whatsapp_number: string;
  email?: string | null;
}

export interface MatchWithContact {
  match: Match;
  partner_contact: RevealedContact | null; // null until both paid
  your_request: PublicRequest;
  partner_request: PublicRequest;
}

// -----------------------------------------------------------------------------
// Matching / Browse Types
// -----------------------------------------------------------------------------

export interface BrowseFilters {
  state?: string;
  city?: string;
  profession?: ProfessionType;
  request_category?: RequestCategory;
  courier_preference?: CourierPreference;
  destination_country?: string;
  preferred_send_date?: string;
  keyword?: string;
}

export interface MatchScore {
  request: PublicRequest;
  score: number;
}

// -----------------------------------------------------------------------------
// API Response Wrappers
// -----------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// -----------------------------------------------------------------------------
// Paystack Types
// -----------------------------------------------------------------------------

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    gateway_response: string;
    channel: string;
    currency: string;
    ip_address: string;
    paid_at: string;
    authorization: {
      authorization_code: string;
      card_type: string;
      last4: string;
      bank: string;
    };
    customer: {
      id: number;
      email: string;
    };
  };
}

// -----------------------------------------------------------------------------
// Admin Types
// -----------------------------------------------------------------------------

export interface AdminStats {
  total_users: number;
  total_requests: number;
  total_matches: number;
  total_payments_verified: number;
  total_revenue_kobo: number;
  pending_reports: number;
  active_requests: number;
}
