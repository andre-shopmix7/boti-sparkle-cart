-- CORREÇÃO DE SEGURANÇA CRÍTICA: Abordagem com função segura

-- 1. Remover a política permissiva atual (se ainda existir)
DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;

-- 2. Criar função para acesso público seguro
CREATE OR REPLACE FUNCTION public.get_public_products()
RETURNS TABLE (
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
  category_id uuid
) AS $$
BEGIN
  RETURN QUERY
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Política restritiva para acesso direto à tabela (apenas usuários autenticados)
CREATE POLICY "Only authenticated users can access products table" 
ON public.products 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. Permitir acesso público à função segura
GRANT EXECUTE ON FUNCTION public.get_public_products() TO public;