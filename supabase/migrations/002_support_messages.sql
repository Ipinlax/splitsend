-- =============================================================================
-- SplitSend Migration: Support Messages & Enhanced Reports
-- Run in Supabase SQL Editor AFTER schema.sql
-- =============================================================================

-- Message category enum
CREATE TYPE support_category AS ENUM (
  'payment_issue',
  'match_problem',
  'report_user',
  'general_help',
  'other'
);

-- Support message status
CREATE TYPE support_status AS ENUM ('open', 'resolved', 'ignored');

-- =============================================================================
-- SUPPORT MESSAGES TABLE
-- Stores contact form submissions from the /support page
-- SECURITY: Admin WhatsApp number is NEVER stored here — env config only
-- =============================================================================
CREATE TABLE public.support_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Contact fields (provided by user in form)
  name            TEXT NOT NULL,
  whatsapp        TEXT NOT NULL,
  email           TEXT,
  message         TEXT NOT NULL,
  category        support_category NOT NULL DEFAULT 'general_help',

  -- Optional context links
  match_id        UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  request_id      UUID REFERENCES public.requests(id) ON DELETE SET NULL,

  -- Admin workflow
  status          support_status NOT NULL DEFAULT 'open',
  admin_note      TEXT,
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_messages_user ON public.support_messages(user_id);
CREATE INDEX idx_support_messages_status ON public.support_messages(status);
CREATE INDEX idx_support_messages_category ON public.support_messages(category);
CREATE INDEX idx_support_messages_created ON public.support_messages(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_support_messages
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can insert their own support messages
CREATE POLICY "support_messages_insert_own"
  ON public.support_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own support messages
CREATE POLICY "support_messages_select_own"
  ON public.support_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Admin reads all via service_role (bypasses RLS)

-- =============================================================================
-- Add status column to reports if not exists
-- =============================================================================
-- (Already in schema.sql — this is a reminder comment only)

-- Add admin_note to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- =============================================================================
-- ADMIN VIEW: combined support + reports summary
-- Used server-side with service_role key only
-- =============================================================================
CREATE OR REPLACE VIEW public.admin_support_summary AS
  SELECT
    id,
    'support' AS source,
    user_id,
    name AS contact_name,
    whatsapp AS contact_whatsapp,
    category::TEXT AS category,
    message,
    match_id,
    NULL::UUID AS request_id_ref,
    status::TEXT AS status,
    created_at
  FROM public.support_messages
  UNION ALL
  SELECT
    r.id,
    'report' AS source,
    r.reporter_id AS user_id,
    p.full_name AS contact_name,
    p.whatsapp_number AS contact_whatsapp,
    r.reason::TEXT AS category,
    r.description AS message,
    r.match_id,
    r.request_id AS request_id_ref,
    r.status::TEXT AS status,
    r.created_at
  FROM public.reports r
  LEFT JOIN public.profiles p ON p.id = r.reporter_id
  ORDER BY created_at DESC;
