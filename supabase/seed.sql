-- =============================================================================
-- SplitSend Seed Data (Development Only)
-- WARNING: Do NOT run this in production
-- Run AFTER schema.sql
-- =============================================================================

-- Note: Auth users must be created via Supabase Auth first.
-- These UUIDs are placeholders — replace with real auth user UUIDs.

-- Sample seed is intentionally minimal. No real contact data.
-- Profiles are auto-created by the trigger on auth.users insert.

-- Insert sample active requests (without private contact info for safety)
-- In real development, create users via Supabase Auth UI, then update profiles.

-- Example of updating a profile after auth signup:
-- UPDATE public.profiles
-- SET full_name = 'Sample User', profession = 'pharmacist', state = 'Lagos', city = 'Lagos'
-- WHERE id = 'your-auth-user-uuid';

-- Placeholder insert for testing (replace uuid with real user id from auth.users)
/*
INSERT INTO public.requests (
  user_id, first_name, profession, request_category,
  state, city, courier_preference, destination_country,
  preferred_send_date, notes, full_name_private, whatsapp_number
)
VALUES
  (
    'replace-with-real-user-uuid',
    'Adaeze',
    'pharmacist',
    'pebc',
    'Lagos',
    'Lagos',
    'dhl',
    'Canada',
    CURRENT_DATE + INTERVAL '7 days',
    'Looking to split DHL cost for PEBC application to Canada.',
    'Adaeze Okafor',
    '+2348012345678'
  ),
  (
    'replace-with-real-user-uuid-2',
    'Emeka',
    'student',
    'wes',
    'Lagos',
    'Lagos',
    'any',
    'Canada',
    CURRENT_DATE + INTERVAL '5 days',
    'Sending WES transcripts. Open to DHL or FedEx.',
    'Emeka Chukwu',
    '+2348023456789'
  );
*/

-- Note: Use the Supabase Auth UI or API to create test users first.
-- Then update their profiles and create requests via the app interface.
