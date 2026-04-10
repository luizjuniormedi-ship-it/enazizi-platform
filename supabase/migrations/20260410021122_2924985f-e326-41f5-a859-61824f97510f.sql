UPDATE public.medical_image_questions
SET status = 'needs_review'
WHERE status = 'published'
AND asset_id IN (
  SELECT id FROM public.medical_image_assets WHERE is_active = false
);