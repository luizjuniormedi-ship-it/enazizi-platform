
-- Fix infinite recursion between teacher_simulados and teacher_simulado_results
-- The problem: teacher_simulados SELECT policy references teacher_simulado_results,
-- and teacher_simulado_results SELECT policy (via "Students can manage own results" ALL)
-- references teacher_simulados indirectly, causing infinite recursion.

-- Step 1: Drop the problematic policy on teacher_simulados that causes the cycle
DROP POLICY IF EXISTS "Students can read assigned simulados" ON public.teacher_simulados;

-- Step 2: Recreate it using a security definer function to break the recursion
CREATE OR REPLACE FUNCTION public.student_has_simulado_result(_user_id uuid, _simulado_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_simulado_results
    WHERE student_id = _user_id AND simulado_id = _simulado_id
  )
$$;

-- Step 3: Recreate the policy using the function
CREATE POLICY "Students can read assigned simulados"
ON public.teacher_simulados
FOR SELECT
TO authenticated
USING (public.student_has_simulado_result(auth.uid(), id));
