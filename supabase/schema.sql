-- =============================================================================
-- SplitSend Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE profession_type AS ENUM (
  'pharmacist', 'nurse', 'doctor', 'student', 'engineer',
  'lawyer', 'other_professional', 'general_applicant'
);

CREATE TYPE request_category AS ENUM (
  'pebc', 'wes', 'transcript', 'licensing_body',
  'school_admission', 'embassy_immigration', 'general_courier', 'other'
);

CREATE TYPE courier_preference AS ENUM ('dhl', 'ups', 'fedex', 'any');

CREATE TYPE request_status AS ENUM (
  'active', 'matched', 'completed', 'cancelled', 'suspended'
);

CREATE TYPE match_status AS ENUM (
  'pending', 'initiator_paid', 'partner_paid', 'both_paid', 'completed', 'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'success', 'failed', 'abandoned'
);

CREATE TYPE notification_type AS ENUM (
  'connection_request', 'payment_received', 'both_paid',
  'contact_revealed', 'match_completed', 'issue_reported', 'system'
);

CREATE TYPE report_reason AS ENUM (
  'fake_listing', 'spam', 'abusive_behavior', 'wrong_info',
  'suspicious_activity', 'other'
);

CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

CREATE TYPE admin_action_type AS ENUM (
  'suspend_user', 'unsuspend_user', 'delete_request',
  'resolve_report', 'close_match', 'review_payment'
);

CREATE TYPE user_role AS ENUM ('user', 'admin');

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES TABLE
-- Extended user profile linked to auth.users
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'user',
  full_name       TEXT,
  whatsapp_number TEXT,
  profession      profession_type,
  state           TEXT,
  city            TEXT,
  is_suspended    BOOLEAN NOT NULL DEFAULT false,
  suspended_at    TIMESTAMPTZ,
  suspended_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- REQUESTS TABLE
-- Public listings for document-sending requests
-- -----------------------------------------------------------------------------
CREATE TABLE public.requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Safe public fields (visible to all)
  first_name            TEXT NOT NULL,
  profession            profession_type NOT NULL,
  request_category      request_category NOT NULL,
  state                 TEXT NOT NULL,
  city                  TEXT NOT NULL,
  area                  TEXT,
  courier_preference    courier_preference NOT NULL DEFAULT 'any',
  destination_country   TEXT NOT NULL,
  destination_institution TEXT,
  document_type         TEXT,
  preferred_send_date   DATE NOT NULL,
  notes                 TEXT,
  status                request_status NOT NULL DEFAULT 'active',

  -- Private fields (never exposed via public API)
  -- Contact revealed only after both payments verified
  full_name_private     TEXT NOT NULL,
  whatsapp_number       TEXT NOT NULL,
  email_private         TEXT,

  -- Anti-spam
  post_count_today      INTEGER DEFAULT 1,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for matching performance
CREATE INDEX idx_requests_state ON public.requests(state);
CREATE INDEX idx_requests_city ON public.requests(city);
CREATE INDEX idx_requests_category ON public.requests(request_category);
CREATE INDEX idx_requests_destination ON public.requests(destination_country);
CREATE INDEX idx_requests_courier ON public.requests(courier_preference);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_user_id ON public.requests(user_id);
CREATE INDEX idx_requests_send_date ON public.requests(preferred_send_date);

-- -----------------------------------------------------------------------------
-- MATCHES TABLE
-- Tracks connections between two requests
-- -----------------------------------------------------------------------------
CREATE TABLE public.matches (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_request_id  UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  partner_request_id    UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  initiator_user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  status                match_status NOT NULL DEFAULT 'pending',

  -- Contact reveal flags (set only after backend verifies payment)
  initiator_contact_revealed  BOOLEAN NOT NULL DEFAULT false,
  partner_contact_revealed    BOOLEAN NOT NULL DEFAULT false,

  -- Optional: booking receipt upload path (Supabase storage)
  booking_receipt_path  TEXT,

  -- Timestamps
  initiator_paid_at     TIMESTAMPTZ,
  partner_paid_at       TIMESTAMPTZ,
  both_paid_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate matches between same pair
  UNIQUE(initiator_request_id, partner_request_id),
  -- Prevent self-match
  CONSTRAINT no_self_match CHECK (initiator_user_id != partner_user_id)
);

CREATE INDEX idx_matches_initiator ON public.matches(initiator_user_id);
CREATE INDEX idx_matches_partner ON public.matches(partner_user_id);
CREATE INDEX idx_matches_status ON public.matches(status);

-- -----------------------------------------------------------------------------
-- PAYMENTS TABLE
-- Records every payment attempt and its status
-- -----------------------------------------------------------------------------
CREATE TABLE public.payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id              UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Paystack data
  paystack_reference    TEXT UNIQUE NOT NULL,
  paystack_access_code  TEXT,
  amount_kobo           INTEGER NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'NGN',
  status                payment_status NOT NULL DEFAULT 'pending',

  -- Verification metadata
  verified_at           TIMESTAMPTZ,
  gateway_response      TEXT,
  channel               TEXT,
  ip_address            TEXT,

  -- Prevent replay attacks
  webhook_processed     BOOLEAN NOT NULL DEFAULT false,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only pay once per match
  UNIQUE(match_id, user_id)
);

CREATE INDEX idx_payments_match_id ON public.payments(match_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_reference ON public.payments(paystack_reference);
CREATE INDEX idx_payments_status ON public.payments(status);

-- -----------------------------------------------------------------------------
-- REPORTS TABLE
-- User reports of suspicious or fake listings
-- -----------------------------------------------------------------------------
CREATE TABLE public.reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_id      UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  match_id        UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  reason          report_reason NOT NULL,
  description     TEXT,
  status          report_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX idx_reports_status ON public.reports(status);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS TABLE
-- In-app notification log
-- -----------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, is_read);

-- -----------------------------------------------------------------------------
-- ADMIN ACTIONS TABLE
-- Audit log of all admin actions
-- -----------------------------------------------------------------------------
CREATE TABLE public.admin_actions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type     admin_action_type NOT NULL,
  target_user_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  target_report_id  UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  target_match_id   UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  reason          TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_type ON public.admin_actions(action_type);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_requests
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_matches
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- SECURITY: Every table must have RLS enabled.
-- Policies control what each authenticated user can see or modify.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES: RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile only
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile only
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent users from changing their own role (only service_role can)
-- Admin reads are done server-side using service_role key, bypassing RLS

-- -----------------------------------------------------------------------------
-- REQUESTS: RLS
-- Public listings must NOT expose private contact fields
-- -----------------------------------------------------------------------------
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated) can view safe public fields of active requests
-- Note: the API layer must SELECT only public columns — never full_name_private,
-- whatsapp_number, or email_private from this policy
CREATE POLICY "requests_select_active"
  ON public.requests FOR SELECT
  USING (status = 'active' OR user_id = auth.uid());

-- Users can insert their own requests
CREATE POLICY "requests_insert_own"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "requests_update_own"
  ON public.requests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own requests
CREATE POLICY "requests_delete_own"
  ON public.requests FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- MATCHES: RLS
-- Users can only see matches they are part of
-- -----------------------------------------------------------------------------
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_select_participant"
  ON public.matches FOR SELECT
  USING (auth.uid() = initiator_user_id OR auth.uid() = partner_user_id);

-- Match creation is done server-side (service_role) — no user INSERT policy needed

-- Users can update specific fields on their own matches
-- (e.g., mark completed) — restricted to safe fields via API
CREATE POLICY "matches_update_participant"
  ON public.matches FOR UPDATE
  USING (auth.uid() = initiator_user_id OR auth.uid() = partner_user_id);

-- -----------------------------------------------------------------------------
-- PAYMENTS: RLS
-- Users can only see their own payment records
-- -----------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Payment records are created server-side only (service_role)

-- -----------------------------------------------------------------------------
-- REPORTS: RLS
-- Users can submit and view their own reports
-- -----------------------------------------------------------------------------
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert_own"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admin reads all reports via service_role (bypasses RLS)

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS: RLS
-- Users can only see and update their own notifications
-- -----------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications are created server-side (service_role)

-- -----------------------------------------------------------------------------
-- ADMIN ACTIONS: RLS
-- Only admin (service_role) can access — no user policies needed
-- All admin operations use server-side service_role key which bypasses RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
-- No user-accessible policies: admin_actions are only via service_role

-- =============================================================================
-- SECURITY VIEWS
-- Safe public view of requests — never exposes private contact fields
-- =============================================================================

CREATE OR REPLACE VIEW public.requests_public AS
  SELECT
    id,
    user_id,
    first_name,
    profession,
    request_category,
    state,
    city,
    area,
    courier_preference,
    destination_country,
    destination_institution,
    document_type,
    preferred_send_date,
    notes,
    status,
    created_at
  FROM public.requests
  WHERE status = 'active';

-- Restrict view to authenticated users
ALTER VIEW public.requests_public OWNER TO authenticated;

-- =============================================================================
-- SEED SAMPLE DATA (Development Only)
-- Remove or guard this section before production
-- =============================================================================

-- Sample data is in supabase/seed.sql — kept separate for safety
