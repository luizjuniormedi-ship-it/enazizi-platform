
INSERT INTO public.system_flags (flag_key, enabled, description, category, rollout_mode)
VALUES ('image_questions_enabled', false, 'Habilita questões com imagem médica nos simulados', 'simulados', 'global')
ON CONFLICT (flag_key) DO NOTHING;
