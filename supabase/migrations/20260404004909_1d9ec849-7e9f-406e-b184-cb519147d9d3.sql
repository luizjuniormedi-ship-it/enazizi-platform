-- Add INSERT policy for profiles to prevent arbitrary user_id spoofing
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());