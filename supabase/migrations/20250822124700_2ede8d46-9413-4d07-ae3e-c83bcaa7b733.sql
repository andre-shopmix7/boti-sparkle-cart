-- Fix security issue: Update function to have secure search_path
CREATE OR REPLACE FUNCTION public.set_session_context(session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate session_id format (basic validation)
  IF session_id IS NULL OR length(session_id) < 10 THEN
    RAISE EXCEPTION 'Invalid session_id';
  END IF;
  
  -- Set the session context
  PERFORM set_config('request.session_id', session_id, true);
END;
$$;