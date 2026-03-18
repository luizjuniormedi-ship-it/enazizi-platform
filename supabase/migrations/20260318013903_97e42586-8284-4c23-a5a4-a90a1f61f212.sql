
CREATE TABLE public.daily_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_date date NOT NULL DEFAULT CURRENT_DATE,
  plan_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_blocks integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_date)
);

ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own daily plans"
ON public.daily_plans FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_daily_plans_updated_at
  BEFORE UPDATE ON public.daily_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
