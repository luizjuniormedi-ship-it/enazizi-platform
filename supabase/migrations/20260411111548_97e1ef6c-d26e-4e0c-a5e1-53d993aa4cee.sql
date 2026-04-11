
UPDATE public.medical_image_questions
SET status = 'rejected'
WHERE asset_id IN (
  SELECT id FROM public.medical_image_assets WHERE review_status = 'blocked_clinical'
)
AND status != 'rejected';
