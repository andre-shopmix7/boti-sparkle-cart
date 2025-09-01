-- Adicionar campos administrativos à tabela products
ALTER TABLE public.products 
ADD COLUMN cost_price numeric,
ADD COLUMN purchase_date date,
ADD COLUMN invoice_number text,
ADD COLUMN admin_notes text,
ADD COLUMN profit_percentage numeric GENERATED ALWAYS AS (
  CASE 
    WHEN cost_price > 0 THEN 
      ((price - cost_price) / cost_price) * 100
    ELSE 0
  END
) STORED,
ADD COLUMN profit_amount numeric GENERATED ALWAYS AS (
  price - COALESCE(cost_price, 0)
) STORED,
ADD COLUMN inventory_value numeric GENERATED ALWAYS AS (
  COALESCE(cost_price, 0) * stock_quantity
) STORED;