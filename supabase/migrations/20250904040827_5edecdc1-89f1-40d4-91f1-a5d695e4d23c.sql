-- Fix remaining security issues with properly managed RLS policies

-- 1. Clean up and recreate profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate secure profiles policies
CREATE POLICY "secure_profiles_select_own" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "secure_profiles_insert_own" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "secure_profiles_update_own" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "secure_profiles_admin_access" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Clean up and recreate products table policies
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products only through function" ON public.products;

-- Only admins can directly access products table with sensitive data
CREATE POLICY "secure_products_admin_only" 
ON public.products 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Clean up and recreate orders table policies  
DROP POLICY IF EXISTS "Users can view only their own orders" ON public.orders;
DROP POLICY IF EXISTS "Guests can view only their session orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders only" ON public.orders;
DROP POLICY IF EXISTS "Only admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can delete orders" ON public.orders;

-- Stricter order policies
CREATE POLICY "secure_orders_user_select" 
ON public.orders 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "secure_orders_guest_select" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() IS NULL AND 
  session_id IS NOT NULL AND 
  session_id = current_setting('request.session_id'::text, true)
);

CREATE POLICY "secure_orders_insert" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND guest_email IS NOT NULL AND session_id IS NOT NULL)
);

CREATE POLICY "secure_orders_admin_update" 
ON public.orders 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "secure_orders_admin_delete" 
ON public.orders 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Create secure customer products function
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

-- 5. Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;