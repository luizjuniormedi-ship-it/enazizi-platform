
-- Audit log table for image question status changes
CREATE TABLE public.image_question_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  payload_summary JSONB,
  triggered_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_iq_audit_question ON public.image_question_audit_log(question_id);
CREATE INDEX idx_iq_audit_created ON public.image_question_audit_log(created_at DESC);

-- RLS
ALTER TABLE public.image_question_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.image_question_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_image_question_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.image_question_audit_log (question_id, previous_status, new_status, reason, payload_summary)
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      CASE
        WHEN NEW.status = 'rejected' THEN 'Falhou validação de qualidade'
        WHEN NEW.status = 'upgrading' THEN 'Iniciando upgrade via IA'
        WHEN NEW.status = 'upgraded' THEN 'Upgrade concluído pela IA'
        WHEN NEW.status = 'needs_review' THEN 'Passou validação automática'
        WHEN NEW.status = 'published' THEN 'Aprovado para publicação'
        ELSE 'Mudança de status'
      END,
      jsonb_build_object(
        'stmt_len', LENGTH(NEW.statement),
        'exp_len', LENGTH(NEW.explanation),
        'difficulty', NEW.difficulty,
        'exam_style', NEW.exam_style
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_image_question_status_audit
BEFORE UPDATE ON public.medical_image_questions
FOR EACH ROW
EXECUTE FUNCTION public.log_image_question_status_change();
