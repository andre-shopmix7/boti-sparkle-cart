-- Assign admin role to the logged in user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('d9d09923-bca9-4a16-beb8-d3bc7a21e7f1', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;