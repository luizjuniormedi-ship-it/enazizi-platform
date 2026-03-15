CREATE POLICY "Students can read assigned simulados"
ON public.teacher_simulados
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT simulado_id FROM public.teacher_simulado_results
    WHERE student_id = auth.uid()
  )
);