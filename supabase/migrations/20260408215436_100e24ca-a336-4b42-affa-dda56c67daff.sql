UPDATE medical_image_questions 
SET status = 'rejected', 
    validated_by = 'multimodal_audit_bot',
    validated_at = now()
WHERE id IN ('f95e7c8d-f685-4a6b-8798-7d49c1723a9e', 'e5875b4f-bbd7-4ad7-92a2-8c303f5f0b25', '13ae5328-c6b3-4014-8b5f-9a61a240a459');

UPDATE medical_image_assets 
SET multimodal_ready = false, 
    review_status = 'blocked_clinical'
WHERE id IN (
  SELECT DISTINCT asset_id FROM medical_image_questions 
  WHERE id IN ('f95e7c8d-f685-4a6b-8798-7d49c1723a9e', 'e5875b4f-bbd7-4ad7-92a2-8c303f5f0b25', '13ae5328-c6b3-4014-8b5f-9a61a240a459')
);