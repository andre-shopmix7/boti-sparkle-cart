-- Add session_id column to orders table for guest order tracking
ALTER TABLE public.orders ADD COLUMN session_id text;

-- Create index for better performance on session_id queries
CREATE INDEX idx_orders_session_id ON public.orders(session_id);

-- Update the INSERT policy to properly handle session_id for guests
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND guest_email IS NOT NULL AND session_id IS NOT NULL)
);

-- Create a secure SELECT policy for guests to view only their own orders
CREATE POLICY "Guests can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = current_setting('request.session_id', true))
);

-- Update the existing SELECT policy name for clarity
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Authenticated users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add a function to safely set session context
CREATE OR REPLACE FUNCTION public.set_session_context(session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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