-- Create admin dashboard function to bypass RLS for dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS TABLE(
  product_count BIGINT,
  total_inventory_value NUMERIC,
  total_potential_profit NUMERIC,
  total_stock_items BIGINT,
  expiring_products JSON
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.products WHERE is_active = true) as product_count,
    (SELECT COALESCE(SUM(inventory_value), 0) FROM public.products WHERE is_active = true) as total_inventory_value,
    (SELECT COALESCE(SUM((profit_amount * stock_quantity)), 0) FROM public.products WHERE is_active = true) as total_potential_profit,
    (SELECT COALESCE(SUM(stock_quantity), 0) FROM public.products WHERE is_active = true) as total_stock_items,
    (SELECT COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'name', name,
          'brand', brand,
          'stock_quantity', stock_quantity,
          'expiry_date', expiry_date
        )
      ), '[]'::json
    ) FROM public.products 
    WHERE is_active = true 
    AND expiry_date IS NOT NULL 
    AND expiry_date <= (CURRENT_DATE + INTERVAL '6 months')
    AND expiry_date >= CURRENT_DATE
    LIMIT 10
    ) as expiring_products;
$$;

-- Grant execute to authenticated users (admin check will be in the hook)
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_data() TO authenticated;