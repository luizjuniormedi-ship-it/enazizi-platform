-- Índice composto para busca de questões por review_status + topic
CREATE INDEX IF NOT EXISTS idx_qb_review_topic
  ON public.questions_bank (review_status, topic);

-- Índices para question_topic_map (FK lookups e joins)
CREATE INDEX IF NOT EXISTS idx_qtm_question_id
  ON public.question_topic_map (question_id);

CREATE INDEX IF NOT EXISTS idx_qtm_topic_id
  ON public.question_topic_map (topic_id);

CREATE INDEX IF NOT EXISTS idx_qtm_subtopic_id
  ON public.question_topic_map (subtopic_id);