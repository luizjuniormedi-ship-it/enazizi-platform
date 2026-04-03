
-- QA Test Runs - each execution of the QA agent
CREATE TABLE public.qa_test_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_type TEXT NOT NULL DEFAULT 'daily',
  status TEXT NOT NULL DEFAULT 'running',
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed_tests INTEGER NOT NULL DEFAULT 0,
  failed_tests INTEGER NOT NULL DEFAULT 0,
  warning_tests INTEGER NOT NULL DEFAULT 0,
  summary_json JSONB DEFAULT '{}',
  duration_ms INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QA Test Results - individual test results
CREATE TABLE public.qa_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.qa_test_runs(id) ON DELETE CASCADE,
  test_suite TEXT NOT NULL,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  details_json JSONB DEFAULT '{}',
  duration_ms INTEGER DEFAULT 0,
  module_tested TEXT,
  error_message TEXT,
  suggestion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_qa_runs_status ON public.qa_test_runs(status);
CREATE INDEX idx_qa_runs_created ON public.qa_test_runs(created_at DESC);
CREATE INDEX idx_qa_results_run ON public.qa_test_results(run_id);
CREATE INDEX idx_qa_results_status ON public.qa_test_results(status);

-- Enable RLS
ALTER TABLE public.qa_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_test_results ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view QA runs"
ON public.qa_test_runs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view QA results"
ON public.qa_test_results FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
