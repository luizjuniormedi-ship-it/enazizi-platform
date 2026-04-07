
-- Tabela de domínios (Medicina, ENEM, OAB, etc.)
CREATE TABLE public.domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📚',
  config_json JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Domains visíveis para autenticados" ON public.domains
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam domínios" ON public.domains
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Tabela de áreas por domínio (substitui "especialidade")
CREATE TABLE public.domain_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT DEFAULT '📖',
  ordem INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(domain_id, slug)
);

ALTER TABLE public.domain_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Areas visíveis para autenticados" ON public.domain_areas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam áreas" ON public.domain_areas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_domain_areas_updated_at
  BEFORE UPDATE ON public.domain_areas
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Tabela de temas por área (substitui "tema/subtema")
CREATE TABLE public.domain_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID NOT NULL REFERENCES public.domain_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  ordem INT DEFAULT 0,
  difficulty_base INT DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(area_id, slug)
);

ALTER TABLE public.domain_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics visíveis para autenticados" ON public.domain_topics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam topics" ON public.domain_topics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_domain_topics_updated_at
  BEFORE UPDATE ON public.domain_topics
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Adicionar domain_id ao profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES public.domains(id);

-- Inserir domínio Medicina como padrão
INSERT INTO public.domains (name, slug, description, icon, config_json)
VALUES (
  'Medicina',
  'medicina',
  'Preparação para residência médica, Revalida e ENARE',
  '🩺',
  '{"exam_targets": ["ENARE", "USP", "UNIFESP", "SUS-SP", "Revalida"], "has_clinical_cases": true, "has_anamnesis": true, "has_osce": true, "bibliography": ["Harrison", "Sabiston", "Nelson", "Williams", "Robbins", "Guyton"]}'::jsonb
);
