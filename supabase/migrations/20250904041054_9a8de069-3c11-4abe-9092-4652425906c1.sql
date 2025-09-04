-- Complete security hardening with unique naming

-- 1. Create secure public function for customer product access
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

-- 2. Grant proper permissions
GRANT EXECUTE ON FUNCTION public.get_public_products_secure() TO anon, authenticated;

-- 3. Document the security model
COMMENT ON FUNCTION public.get_public_products_secure() IS 'Secure public access to product catalog - excludes sensitive business data like cost_price, profit_amount, profit_percentage, inventory_value, admin_notes';