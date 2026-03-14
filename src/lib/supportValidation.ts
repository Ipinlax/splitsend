// =============================================================================
// Support message validation — append to validation.ts
// These are the additional schemas needed for support/contact features
// =============================================================================

import { z } from "zod";

const safeText = (max: number) =>
  z.string().max(max).transform((s) => s.trim()).refine((s) => s.length > 0, "Cannot be empty");

const optionalText = (max: number) =>
  z.string().max(max).transform((s) => s.trim()).optional();

export const supportMessageSchema = z.object({
  name: safeText(100),
  whatsapp: z
    .string()
    .min(10)
    .max(15)
    .regex(/^\+?[0-9]{10,15}$/, "Invalid WhatsApp number"),
  email: z.string().email().max(254).optional().or(z.literal("")),
  message: safeText(2000),
  category: z.enum([
    "payment_issue",
    "match_problem",
    "report_user",
    "general_help",
    "other",
  ]),
  match_id: z.string().uuid().optional(),
  request_id: z.string().uuid().optional(),
});

export type SupportMessageInput = z.infer<typeof supportMessageSchema>;

export const matchReportSchema = z.object({
  match_id: z.string().uuid("Invalid match ID"),
  reason: z.enum([
    "user_not_responding",
    "payment_problem",
    "wrong_details",
    "suspicious_activity",
    "other",
  ]),
  description: optionalText(1000),
});

export type MatchReportInput = z.infer<typeof matchReportSchema>;
