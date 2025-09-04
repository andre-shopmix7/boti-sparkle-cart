-- Final security hardening - completely lock down product data access

-- 1. Drop the customer_products view as it may not have proper RLS
DROP VIEW IF EXISTS public.customer_products;

-- 2. Ensure products table is completely locked down except for admins
DROP POLICY IF EXISTS "secure_products_admin_only" ON public.products;

CREATE POLICY "products_admin_full_access" 
ON public.products 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create a truly secure public function for customer product access
-- This replaces direct table access completely
CREATE OR REPLACE FUNCTION public.get_public_products_secure()
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
  -- Only return non-sensitive product data for public consumption
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.description,
    p.price,
    p.original_price,
    p.discount_percentage,
    CASE 
      WHEN p.stock_quantity > 0 THEN p.stock_quantity
      ELSE 0
    END as stock_quantity,
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
  WHERE p.is_active = true
  ORDER BY p.created_at DESC;
$$;

-- 4. Grant execute permission on the public function
GRANT EXECUTE ON FUNCTION public.get_public_products_secure() TO anon, authenticated;

-- 5. Revoke any remaining public access to products table
REVOKE ALL ON public.products FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO service_role;

-- 6. Document the security model
COMMENT ON FUNCTION public.get_public_products_secure() IS 'Secure public access to product catalog - excludes sensitive business data like cost_price, profit_amount, profit_percentage, inventory_value, admin_notes';
COMMENT ON POLICY "products_admin_full_access" ON public.products IS 'Only authenticated admin users can directly access products table with sensitive business data';