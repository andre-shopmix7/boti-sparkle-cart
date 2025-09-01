-- Adicionar coluna data de validade à tabela products
ALTER TABLE public.products 
ADD COLUMN expiry_date date;