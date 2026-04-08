
-- 1. Adicionar novos status ao enum de review dos assets
ALTER TYPE image_review_status ADD VALUE IF NOT EXISTS 'needs_review';
ALTER TYPE image_review_status ADD VALUE IF NOT EXISTS 'blocked_clinical';
ALTER TYPE image_review_status ADD VALUE IF NOT EXISTS 'experimental_only';
ALTER TYPE image_review_status ADD VALUE IF NOT EXISTS 'published';
