-- Create banners table for promotional banners management
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  image_url text,
  button_text text,
  button_link text,
  background_color text DEFAULT '#000000',
  text_color text DEFAULT '#ffffff',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policy for public to view active banners
CREATE POLICY "Everyone can view active banners" 
ON public.banners 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a sample promotional banner
INSERT INTO public.banners (title, subtitle, button_text, button_link, background_color, text_color, is_active) VALUES
('Mega Promoção Boticário', 'Até 50% OFF em produtos selecionados + Frete Grátis', 'Ver Ofertas', '/products', '#8B4513', '#FFFFFF', true);