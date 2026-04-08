-- Add missing enum values to image_question_status
ALTER TYPE image_question_status ADD VALUE IF NOT EXISTS 'upgrading';
ALTER TYPE image_question_status ADD VALUE IF NOT EXISTS 'upgraded';
ALTER TYPE image_question_status ADD VALUE IF NOT EXISTS 'needs_review';
ALTER TYPE image_question_status ADD VALUE IF NOT EXISTS 'rejected';