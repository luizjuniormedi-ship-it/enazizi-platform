CREATE OR REPLACE FUNCTION public.get_login_stats()
RETURNS TABLE (alunos bigint, questoes bigint, flashcards bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM profiles WHERE user_type = 'estudante'),
    (SELECT (SELECT count(*) FROM questions_bank) + (SELECT count(*) FROM real_exam_questions WHERE is_active = true)),
    (SELECT count(*) FROM flashcards);
$$;

GRANT EXECUTE ON FUNCTION public.get_login_stats() TO anon, authenticated;