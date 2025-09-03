-- Create role-based access control system to secure customer data

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 5. Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 6. Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Update orders table RLS policies to include admin access
DROP POLICY IF EXISTS "Authenticated users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Guests can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- New policies with admin access
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Guests can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  (auth.uid() IS NULL) AND 
  (session_id IS NOT NULL) AND 
  (session_id = current_setting('request.session_id'::text, true))
);

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  ((auth.uid() IS NULL) AND (guest_email IS NOT NULL) AND (session_id IS NOT NULL))
);

CREATE POLICY "Admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Update products table to restrict sensitive admin data
DROP POLICY IF EXISTS "Only authenticated users can access products table" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

-- New policies with role-based access
CREATE POLICY "Everyone can view basic product info" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all product data" 
ON public.products 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Create function for safe product access (non-admin users)
CREATE OR REPLACE FUNCTION public.get_safe_products()
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

-- 10. Create trigger for automatic timestamp updates on user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Insert admin role for the first user (you'll need to manually assign admin roles)
-- This is commented out as it should be done manually for security
-- INSERT INTO public.user_roles (user_id, role) 
-- SELECT id, 'admin'::public.app_role 
-- FROM auth.users 
-- WHERE email = 'your-admin-email@example.com';