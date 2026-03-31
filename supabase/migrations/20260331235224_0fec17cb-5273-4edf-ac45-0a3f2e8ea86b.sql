
CREATE POLICY "admins_can_update_questions_bank"
ON public.questions_bank
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_can_delete_questions_bank"
ON public.questions_bank
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
