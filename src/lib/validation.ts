// =============================================================================
// Input Validation Schemas (Zod)
//
// All user input is validated server-side before any DB operations.
// Never trust client-submitted data.
// =============================================================================

import { z } from "zod";

// Reusable field validators
const nigerianPhone = z
  .string()
  .min(10)
  .max(15)
  .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number format");

const safeText = (maxLen: number) =>
  z
    .string()
    .max(maxLen, `Max ${maxLen} characters`)
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "Cannot be empty after trimming");

const optionalSafeText = (maxLen: number) =>
  z
    .string()
    .max(maxLen)
    .transform((s) => s.trim())
    .optional();

// Date string in YYYY-MM-DD format, must be today or future
const futureDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((d) => {
    const date = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, "Date must be today or in the future");

// UUID validation
export const uuidSchema = z.string().uuid("Invalid ID format");

// -----------------------------------------------------------------------------
// Create Request Schema
// -----------------------------------------------------------------------------
export const createRequestSchema = z.object({
  first_name: safeText(50),
  profession: z.enum([
    "pharmacist", "nurse", "doctor", "student",
    "engineer", "lawyer", "other_professional", "general_applicant",
  ]),
  request_category: z.enum([
    "pebc", "wes", "transcript", "licensing_body",
    "school_admission", "embassy_immigration", "general_courier", "other",
  ]),
  state: safeText(100),
  city: safeText(100),
  area: optionalSafeText(100),
  courier_preference: z.enum(["dhl", "ups", "fedex", "any"]),
  destination_country: safeText(100),
  destination_institution: optionalSafeText(200),
  document_type: optionalSafeText(200),
  preferred_send_date: futureDate,
  notes: optionalSafeText(500),

  // Private fields — validated strictly
  full_name_private: safeText(100),
  whatsapp_number: nigerianPhone,
  email_private: z.string().email("Invalid email").max(254).optional().or(z.literal("")),

  // Agreement checkboxes
  confirm_correct: z.literal(true, {
    errorMap: () => ({ message: "You must confirm your details are correct" }),
  }),
  agree_terms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms" }),
  }),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

// -----------------------------------------------------------------------------
// Browse / Filter Schema
// -----------------------------------------------------------------------------
export const browseFiltersSchema = z.object({
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  profession: z
    .enum(["pharmacist", "nurse", "doctor", "student", "engineer", "lawyer", "other_professional", "general_applicant"])
    .optional(),
  request_category: z
    .enum(["pebc", "wes", "transcript", "licensing_body", "school_admission", "embassy_immigration", "general_courier", "other"])
    .optional(),
  courier_preference: z.enum(["dhl", "ups", "fedex", "any"]).optional(),
  destination_country: z.string().max(100).optional(),
  preferred_send_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  keyword: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type BrowseFiltersInput = z.infer<typeof browseFiltersSchema>;

// -----------------------------------------------------------------------------
// Connect Schema
// -----------------------------------------------------------------------------
export const connectSchema = z.object({
  partner_request_id: uuidSchema,
});

// -----------------------------------------------------------------------------
// Payment Verify Schema
// -----------------------------------------------------------------------------
export const verifyPaymentSchema = z.object({
  reference: z
    .string()
    .min(8)
    .max(100)
    .regex(/^[\w-]+$/, "Invalid reference format"),
  match_id: uuidSchema,
});

// -----------------------------------------------------------------------------
// Report Schema
// -----------------------------------------------------------------------------
export const reportSchema = z.object({
  reported_user_id: uuidSchema.optional(),
  request_id: uuidSchema.optional(),
  match_id: uuidSchema.optional(),
  reason: z.enum([
    "fake_listing", "spam", "abusive_behavior",
    "wrong_info", "suspicious_activity", "other",
  ]),
  description: optionalSafeText(1000),
});

// -----------------------------------------------------------------------------
// Auth Schemas
// -----------------------------------------------------------------------------
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  phone: nigerianPhone.optional().or(z.literal("")),
});

export const signInSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

// -----------------------------------------------------------------------------
// Admin Schemas
// -----------------------------------------------------------------------------
export const adminSuspendSchema = z.object({
  user_id: uuidSchema,
  reason: safeText(500),
});

export const adminResolveReportSchema = z.object({
  report_id: uuidSchema,
  status: z.enum(["resolved", "dismissed"]),
  resolution_notes: optionalSafeText(1000),
});

export const adminDeleteRequestSchema = z.object({
  request_id: uuidSchema,
  reason: safeText(500),
});
