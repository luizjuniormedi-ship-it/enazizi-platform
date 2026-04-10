-- Step 1: Block all active assets with suspicious portrait/person URLs
UPDATE public.medical_image_assets
SET 
  is_active = false,
  review_status = 'blocked_clinical',
  integrity_status = 'generic_image',
  multimodal_ready = false
WHERE is_active = true
AND (
  LOWER(image_url) LIKE '%portrait%'
  OR LOWER(image_url) LIKE '%selfie%'
  OR LOWER(image_url) LIKE '%headshot%'
  OR LOWER(image_url) LIKE '%avatar%'
  OR LOWER(image_url) LIKE '%author%'
  OR LOWER(image_url) LIKE '%profile-photo%'
  OR LOWER(image_url) LIKE '%profile_photo%'
  OR LOWER(image_url) LIKE '%profile-pic%'
  OR LOWER(image_url) LIKE '%profile_pic%'
  OR LOWER(image_url) LIKE '%doctor-photo%'
  OR LOWER(image_url) LIKE '%physician%'
  OR LOWER(image_url) LIKE '%nurse%'
  OR LOWER(image_url) LIKE '%staff-photo%'
  OR LOWER(image_url) LIKE '%staff_photo%'
  OR LOWER(image_url) LIKE '%team-photo%'
  OR LOWER(image_url) LIKE '%team_photo%'
  OR LOWER(image_url) LIKE '%bio-photo%'
  OR LOWER(image_url) LIKE '%person-photo%'
  OR LOWER(image_url) LIKE '%person_photo%'
  OR LOWER(image_url) LIKE '%contributor%'
  OR LOWER(image_url) LIKE '%faculty%'
  OR LOWER(image_url) LIKE '%speaker%'
  OR LOWER(image_url) LIKE '%about-us%'
  OR LOWER(image_url) LIKE '%corporate%'
  OR LOWER(image_url) LIKE '%mockup%'
  OR LOWER(image_url) LIKE '%screenshot%'
  OR LOWER(image_url) LIKE '%placeholder%'
  OR LOWER(image_url) LIKE '%logo%'
  OR LOWER(image_url) LIKE '%clipart%'
  OR LOWER(image_url) LIKE '%cartoon%'
  OR LOWER(image_url) LIKE '%illustration%'
);

-- Step 2: Move all published questions linked to inactive assets to needs_review
UPDATE public.medical_image_questions
SET status = 'needs_review'
WHERE status IN ('published', 'upgraded')
AND asset_id IN (
  SELECT id FROM public.medical_image_assets WHERE is_active = false
);