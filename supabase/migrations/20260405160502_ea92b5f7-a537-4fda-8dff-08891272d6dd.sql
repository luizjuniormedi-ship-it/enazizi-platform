INSERT INTO public.system_flags (flag_key, enabled, description, category, rollout_mode)
VALUES ('mission_entry_enabled', false, 'Controla a exibição da tela MissionEntry após login', 'ux', 'global')
ON CONFLICT (flag_key) DO NOTHING;