-- CORREÇÃO DE SEGURANÇA CRÍTICA: Restringir acesso público apenas a dados seguros

-- 1. Remover a política permissiva atual
DROP POLICY "Everyone can view active products" ON public.products;

-- 2. Criar view pública com apenas campos seguros para clientes
CREATE VIEW public.products_public AS 
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

-- 3. Permitir acesso público apenas à view segura
GRANT SELECT ON public.products_public TO public;

-- 4. Política para usuários autenticados (admins) acessarem tudo
CREATE POLICY "Authenticated users can view all product data" 
ON public.products 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 5. Garantir que a view é acessível publicamente
CREATE POLICY "Public can view safe product data" 
ON public.products_public 
FOR SELECT 
USING (true);