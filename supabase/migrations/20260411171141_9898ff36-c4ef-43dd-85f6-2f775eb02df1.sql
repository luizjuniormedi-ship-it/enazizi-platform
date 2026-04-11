
-- Tabela central de mnemônicos auditados e aprovados
CREATE TABLE public.mnemonic_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  content_type TEXT NOT NULL,
  items_json JSONB NOT NULL,
  mnemonic TEXT NOT NULL,
  phrase TEXT NOT NULL,
  items_map_json JSONB NOT NULL,
  scene_description TEXT,
  image_url TEXT,
  quality_score INTEGER NOT NULL DEFAULT 0,
  medical_score INTEGER NOT NULL DEFAULT 0,
  pedagogical_score INTEGER NOT NULL DEFAULT 0,
  verdict TEXT NOT NULL DEFAULT 'approved_visual',
  source_reference TEXT,
  review_question TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vínculo por usuário com controle de reapresentação
CREATE TABLE public.user_mnemonic_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mnemonic_asset_id UUID NOT NULL REFERENCES public.mnemonic_assets(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  trigger_source TEXT NOT NULL DEFAULT 'error_bank',
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  times_shown INTEGER NOT NULL DEFAULT 0,
  helped_after_error BOOLEAN DEFAULT NULL,
  improvement_delta NUMERIC(5,2) DEFAULT NULL,
  mnemonic_not_helping BOOLEAN NOT NULL DEFAULT false,
  accuracy_before NUMERIC(5,2),
  accuracy_after NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mnemonic_asset_id)
);

-- Indexes
CREATE INDEX idx_mnemonic_assets_hash ON public.mnemonic_assets(hash);
CREATE INDEX idx_mnemonic_assets_topic ON public.mnemonic_assets(topic);
CREATE INDEX idx_user_mnemonic_links_user ON public.user_mnemonic_links(user_id);
CREATE INDEX idx_user_mnemonic_links_review ON public.user_mnemonic_links(user_id, next_review_at);
CREATE INDEX idx_user_mnemonic_links_topic ON public.user_mnemonic_links(user_id, topic);

-- RLS
ALTER TABLE public.mnemonic_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mnemonic_links ENABLE ROW LEVEL SECURITY;

-- mnemonic_assets: anyone authenticated can read approved
CREATE POLICY "Authenticated users can read approved mnemonics"
  ON public.mnemonic_assets FOR SELECT
  TO authenticated
  USING (verdict IN ('approved_visual', 'approved_text_map_only'));

-- user_mnemonic_links: users see only their own
CREATE POLICY "Users can view own mnemonic links"
  ON public.user_mnemonic_links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mnemonic links"
  ON public.user_mnemonic_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mnemonic links"
  ON public.user_mnemonic_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role insert for mnemonic_assets (edge functions use service role)
CREATE POLICY "Service role can manage mnemonic assets"
  ON public.mnemonic_assets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_mnemonic_assets_updated_at
  BEFORE UPDATE ON public.mnemonic_assets
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_user_mnemonic_links_updated_at
  BEFORE UPDATE ON public.user_mnemonic_links
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
