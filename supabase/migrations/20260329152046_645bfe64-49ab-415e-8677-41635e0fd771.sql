
-- Table for high-quality real exam questions (separate from questions_bank)
CREATE TABLE public.real_exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  statement TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER,
  explanation TEXT DEFAULT '',
  topic TEXT NOT NULL,
  subtopic TEXT DEFAULT '',
  difficulty INTEGER NOT NULL DEFAULT 4,
  source_url TEXT NOT NULL,
  exam_info TEXT DEFAULT '',
  answer_source TEXT NOT NULL DEFAULT 'unknown',
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  quality_score NUMERIC NOT NULL DEFAULT 0,
  statement_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(statement_hash)
);

-- Index for fast lookups
CREATE INDEX idx_real_exam_questions_topic ON public.real_exam_questions(topic);
CREATE INDEX idx_real_exam_questions_hash ON public.real_exam_questions(statement_hash);

-- Scraping run logs
CREATE TABLE public.scraping_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialty TEXT NOT NULL,
  banca TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  queries_executed INTEGER NOT NULL DEFAULT 0,
  urls_tested INTEGER NOT NULL DEFAULT 0,
  candidate_blocks_found INTEGER NOT NULL DEFAULT 0,
  questions_extracted INTEGER NOT NULL DEFAULT 0,
  questions_accepted INTEGER NOT NULL DEFAULT 0,
  questions_rejected INTEGER NOT NULL DEFAULT 0,
  rejection_reasons JSONB NOT NULL DEFAULT '{}'::jsonb,
  duplicates_found INTEGER NOT NULL DEFAULT 0,
  english_leaked INTEGER NOT NULL DEFAULT 0,
  sources_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_scraping_runs_specialty ON public.scraping_runs(specialty);
CREATE INDEX idx_scraping_runs_status ON public.scraping_runs(status);

-- RLS
ALTER TABLE public.real_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_runs ENABLE ROW LEVEL SECURITY;

-- Admins can manage real exam questions
CREATE POLICY "Admins can manage real exam questions"
  ON public.real_exam_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated can read active real exam questions
CREATE POLICY "Authenticated can read active real exam questions"
  ON public.real_exam_questions FOR SELECT TO authenticated
  USING (is_active = true);

-- Service role can manage all real exam questions
CREATE POLICY "Service role manages real exam questions"
  ON public.real_exam_questions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Admins can read scraping runs
CREATE POLICY "Admins can read scraping runs"
  ON public.scraping_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can manage scraping runs
CREATE POLICY "Service role manages scraping runs"
  ON public.scraping_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
