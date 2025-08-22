-- Add new columns to products table for complete product information
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS original_price NUMERIC,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_price NUMERIC,
ADD COLUMN IF NOT EXISTS special_offer TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update existing products with sample data to match the image
UPDATE products SET 
  brand = 'NATIVA SPA',
  original_price = price * 1.78, -- Simulating 43% discount
  discount_percentage = 43,
  rating = 5.0,
  review_count = 150,
  installments = 4,
  installment_price = price / 4,
  special_offer = 'COMPRE E LEVE REFIL'
WHERE is_active = true;

-- Create favorites table for user wishlist
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id),
  UNIQUE(session_id, product_id)
);

-- Enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for favorites
CREATE POLICY "Users can manage their own favorites"
ON public.favorites
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Guest favorites access"
ON public.favorites
FOR ALL
TO anon
USING (auth.uid() IS NULL AND session_id IS NOT NULL);

-- Add trigger to update products updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();