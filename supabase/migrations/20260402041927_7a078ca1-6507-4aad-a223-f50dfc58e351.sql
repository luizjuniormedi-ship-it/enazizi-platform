CREATE OR REPLACE FUNCTION public.get_login_testimonials()
RETURNS TABLE (feedback_text text, avg_rating numeric, display_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uf.feedback_text,
    ROUND(
      (SELECT AVG(v::numeric) FROM jsonb_each_text(uf.ratings) AS x(k, v)), 1
    ) AS avg_rating,
    COALESCE(
      split_part(p.display_name, ' ', 1) || ' ' || left(split_part(p.display_name, ' ', 2), 1) || '.',
      'Aluno'
    ) AS display_name
  FROM user_feedback uf
  LEFT JOIN profiles p ON p.user_id = uf.user_id
  WHERE uf.feedback_text IS NOT NULL
    AND length(trim(uf.feedback_text)) >= 10
    AND uf.feedback_text !~ '^[.\s]+$'
    AND uf.feedback_text !~ '^(.)\1{4,}'
    AND uf.feedback_text !~ '^[A-Z][a-z]*[A-Z]'
  ORDER BY uf.created_at DESC
  LIMIT 4;
$$;

GRANT EXECUTE ON FUNCTION public.get_login_testimonials() TO anon, authenticated;