DROP POLICY IF EXISTS "Anyone can read validated assets" ON public.medical_image_assets;

CREATE POLICY "Public can read active released image assets"
ON public.medical_image_assets
FOR SELECT
TO public
USING (
  is_active = true
  AND review_status IN ('validated', 'published')
);

CREATE POLICY "Admins can read all image assets"
ON public.medical_image_assets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all image questions"
ON public.medical_image_questions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update image questions"
ON public.medical_image_questions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete image questions"
ON public.medical_image_questions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));