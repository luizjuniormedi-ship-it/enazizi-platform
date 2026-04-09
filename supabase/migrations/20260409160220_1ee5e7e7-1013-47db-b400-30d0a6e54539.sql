-- Reject all weak draft questions (score 50, not suitable for serving)
UPDATE public.medical_image_questions
SET status = 'rejected', updated_at = now()
WHERE status = 'draft' AND editorial_grade = 'weak';

-- Move unaudited drafts to needs_review so they go through the audit pipeline
UPDATE public.medical_image_questions
SET status = 'needs_review', updated_at = now()
WHERE status = 'draft' AND editorial_grade IS NULL AND senior_audit_score IS NULL;