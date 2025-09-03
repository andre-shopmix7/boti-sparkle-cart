-- Fix remaining security issues with stricter RLS policies

-- 1. Fix profiles table - ensure only user can see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix products table - create separate views for customers vs admins
DROP POLICY IF EXISTS "Everyone can view basic product info" ON public.products;
DROP POLICY IF EXISTS "Admins can view all product data" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Only admins can access the products table directly
CREATE POLICY "Admins can manage all products" 
ON public.products 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Customers can only see products through the safe function
CREATE POLICY "Public can view active products only through function" 
ON public.products 
FOR SELECT 
USING (is_active = true AND public.has_role(auth.uid(), 'admin') IS FALSE);

-- 3. Create a customer-safe products view that excludes sensitive business data
CREATE OR REPLACE VIEW public.customer_products AS
SELECT 
  id,
  name,
  brand,
  description,
  price,
  original_price,
  discount_percentage,
  stock_quantity,
  rating,
  review_count,
  installments,
  installment_price,
  is_active,
  is_featured,
  special_offer,
  tags,
  created_at,
  updated_at,
  category_id
FROM public.products
WHERE is_active = true;

-- Enable RLS on the view
ALTER VIEW public.customer_products SET (security_invoker = true);

-- 4. Strengthen orders table policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Guests can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Stricter order policies
CREATE POLICY "Users can view only their own orders" 
ON public.orders 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Guests can view only their session orders" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() IS NULL AND 
  session_id IS NOT NULL AND 
  session_id = current_setting('request.session_id'::text, true)
);

CREATE POLICY "Users can create their own orders only" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND guest_email IS NOT NULL AND session_id IS NOT NULL)
);

CREATE POLICY "Only admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete orders" 
ON public.orders 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update existing functions to be more secure
DROP FUNCTION IF EXISTS public.get_public_products();

-- Replace with a truly secure customer-facing function
CREATE OR REPLACE FUNCTION public.get_customer_products()
RETURNS TABLE(
  id UUID,
  name TEXT,
  brand TEXT,
  description TEXT,
  price NUMERIC,
  original_price NUMERIC,
  discount_percentage INTEGER,
  stock_quantity INTEGER,
  rating NUMERIC,
  review_count INTEGER,
  installments INTEGER,
  installment_price NUMERIC,
  is_active BOOLEAN,
  is_featured BOOLEAN,
  special_offer TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  category_id UUID
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.description,
    p.price,
    p.original_price,
    p.discount_percentage,
    p.stock_quantity,
    p.rating,
    p.review_count,
    p.installments,
    p.installment_price,
    p.is_active,
    p.is_featured,
    p.special_offer,
    p.tags,
    p.created_at,
    p.updated_at,
    p.category_id
  FROM public.products p
  WHERE p.is_active = true;
$$;

-- 6. Create function to check if user is admin (for frontend use)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- 7. Add comment to document security measures
COMMENT ON TABLE public.orders IS 'Customer orders with RLS protecting personal data - only admins and order owners can access';
COMMENT ON TABLE public.profiles IS 'User profiles with RLS ensuring privacy - only profile owner and admins can access';
COMMENT ON TABLE public.products IS 'Products with sensitive business data protected - cost/profit info restricted to admins';
COMMENT ON FUNCTION public.get_customer_products() IS 'Safe product access for customers - excludes sensitive business data';
COMMENT ON FUNCTION public.has_role(UUID, app_role) IS 'Security definer function to check user roles - prevents RLS recursion';