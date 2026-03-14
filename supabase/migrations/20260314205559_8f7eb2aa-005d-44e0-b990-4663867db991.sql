
-- Add is_global flag to uploads table
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;

-- Allow all authenticated users to read global uploads (already have a policy for all authenticated reads, so this is covered)
-- The existing "All authenticated can read uploads" policy already allows this.
