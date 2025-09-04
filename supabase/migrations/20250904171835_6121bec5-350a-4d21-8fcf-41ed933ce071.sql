-- Create function to get admin products with all fields
CREATE OR REPLACE FUNCTION public.get_admin_products()
RETURNS TABLE(
  id uuid, 
  name text, 
  brand text, 
  description text, 
  price numeric, 
  original_price numeric, 
  discount_percentage integer, 
  stock_quantity integer, 
  rating numeric, 
  review_count integer, 
  installments integer, 
  installment_price numeric, 
  is_active boolean, 
  is_featured boolean, 
  special_offer text, 
  tags text[], 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  category_id uuid,
  cost_price numeric,
  purchase_date date,
  profit_percentage numeric,
  profit_amount numeric,
  inventory_value numeric,
  expiry_date date,
  invoice_number text,
  admin_notes text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only allow admin users to access this function
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
    p.category_id,
    p.cost_price,
    p.purchase_date,
    p.profit_percentage,
    p.profit_amount,
    p.inventory_value,
    p.expiry_date,
    p.invoice_number,
    p.admin_notes
  FROM public.products p
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC;
$function$;