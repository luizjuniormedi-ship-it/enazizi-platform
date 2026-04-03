
-- Global AI content cache for reuse across users
CREATE TABLE public.ai_content_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'explanation',
  content_json JSONB NOT NULL,
  model_used TEXT,
  hit_count INTEGER NOT NULL DEFAULT 0,
  quality_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Unique constraint on cache_key + content_type for upsert
CREATE UNIQUE INDEX idx_ai_cache_key_type ON public.ai_content_cache (cache_key, content_type);

-- Index for lookups
CREATE INDEX idx_ai_cache_type ON public.ai_content_cache (content_type);
CREATE INDEX idx_ai_cache_expires ON public.ai_content_cache (expires_at);

-- Enable RLS
ALTER TABLE public.ai_content_cache ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
CREATE POLICY "Authenticated users can read cache"
ON public.ai_content_cache FOR SELECT
TO authenticated
USING (true);

-- Add cost_estimate column to ai_usage_logs for cost tracking
ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS cost_estimate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cache_hit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS model_tier TEXT DEFAULT 'standard';

-- Auto-update updated_at
CREATE TRIGGER update_ai_cache_updated_at
BEFORE UPDATE ON public.ai_content_cache
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
