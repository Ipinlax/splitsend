// =============================================================================
// SplitSend Constants
// =============================================================================

// Admin WhatsApp — stored as NEXT_PUBLIC_ so frontend can build the link
// The actual number is in env vars, NOT hardcoded here.
// Rule: never store admin number in DB tables.
export const ADMIN_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "2348168543901";
export const ADMIN_WHATSAPP_URL = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}`;

export const APP_NAME = "SplitSend";
export const APP_TAGLINE = "Split courier costs with someone nearby";
export const APP_DESCRIPTION =
  "Find someone in your city who also needs to send documents abroad. Share the courier cost. Save money.";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Connection fee
export const CONNECTION_FEE_NGN = Number(process.env.NEXT_PUBLIC_CONNECTION_FEE_NGN ?? 2000);
export const CONNECTION_FEE_KOBO = 200000; // ₦2,000 in kobo

// Nigerian states
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nassarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

// Profession labels
export const PROFESSION_LABELS: Record<string, string> = {
  pharmacist: "Pharmacist",
  nurse: "Nurse",
  doctor: "Doctor",
  student: "Student",
  engineer: "Engineer",
  lawyer: "Lawyer",
  other_professional: "Other Professional",
  general_applicant: "General Applicant",
};

// Request category labels
export const CATEGORY_LABELS: Record<string, string> = {
  pebc: "PEBC",
  wes: "WES",
  transcript: "Transcript",
  licensing_body: "Licensing Body",
  school_admission: "School Admission",
  embassy_immigration: "Embassy / Immigration",
  general_courier: "General Courier",
  other: "Other",
};

// Courier labels
export const COURIER_LABELS: Record<string, string> = {
  dhl: "DHL",
  ups: "UPS",
  fedex: "FedEx",
  any: "Any Courier",
};

// Destination countries (common for Nigerian applicants)
export const COMMON_DESTINATIONS = [
  "Canada",
  "United Kingdom",
  "United States",
  "Australia",
  "Germany",
  "Ireland",
  "Netherlands",
  "France",
  "New Zealand",
  "UAE",
  "Saudi Arabia",
  "South Africa",
  "Ghana",
  "Other",
] as const;

// Request statuses
export const REQUEST_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  matched: "Matched",
  completed: "Completed",
  cancelled: "Cancelled",
  suspended: "Suspended",
};

export const MATCH_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Payment",
  initiator_paid: "Awaiting Partner",
  partner_paid: "Awaiting You",
  both_paid: "Contact Revealed",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Rate limiting
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 10);
export const RATE_LIMIT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
export const MAX_POSTS_PER_DAY = Number(process.env.MAX_POSTS_PER_USER_PER_DAY ?? 3);

// Report reasons
export const REPORT_REASON_LABELS: Record<string, string> = {
  fake_listing: "Fake Listing",
  spam: "Spam",
  abusive_behavior: "Abusive Behavior",
  wrong_info: "Wrong Information",
  suspicious_activity: "Suspicious Activity",
  other: "Other",
};

// Pagination
export const PAGE_SIZE = 20;
