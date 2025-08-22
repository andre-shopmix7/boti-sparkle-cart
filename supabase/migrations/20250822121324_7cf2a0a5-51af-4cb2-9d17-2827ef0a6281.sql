-- Insert sample products based on the Nativa SPA image
INSERT INTO public.products (name, brand, description, price, original_price, discount_percentage, rating, review_count, installments, installment_price, special_offer, stock_quantity, is_active) VALUES
('Combo Nativa Spa Ameixa: Loção Corporal 400ml + Refil 400ml', 'NATIVA SPA', 'A fragrância inesquecível e vibrante da ameixa com hidratação junto ao seu refil, para um cuidado em dobro.', 86.90, 154.80, 43, 5.0, 150, 4, 21.73, 'COMPRE E LEVE REFIL', 50, true),
('Combo Orquídea Noire: Loção Corporal 400ml + Refil 350ml', 'NATIVA SPA', 'A dupla ideal para acelerar a renovação celular da pele enquanto você dorme, deixando-a nutrida e saudável.', 86.90, 154.80, 43, 5.0, 128, 4, 21.73, 'COMPRE E LEVE REFIL', 45, true),
('Combo Nativa Spa Cereja Rouge: Loção Corporal 400ml + Refil 350ml', 'NATIVA SPA', 'A Loção corporal Nativa SPA Cereja Rouge e seu refil garantem firmeza, textura macia e fragrância sensual.', 86.90, 154.80, 43, 5.0, 95, 4, 21.73, 'COMPRE E LEVE REFIL', 60, true),
('Combo Nativa Spa Ameixa Negra: Loção Corporal 400ml + Refil 350ml', 'NATIVA SPA', 'Combo com a explosão deliciosa das duas fragrâncias da Ameixa Negra em dobro, para o seu momento de cuidado.', 86.90, 154.80, 43, 5.0, 210, 4, 21.73, 'COMPRE E LEVE REFIL', 40, true),
('Combo Nativa Spa Uva Merlot: Loção Corporal 400ml + Refil 350ml', 'NATIVA SPA', 'Recupere o tempo perdido para seu cuidado com a loção corporal Nativa Spa Merlot e seu refil para reposição.', 86.90, 154.80, 43, 5.0, 178, 4, 21.73, 'COMPRE E LEVE REFIL', 35, true);

-- Create a default category for body care
INSERT INTO public.categories (name, description) VALUES
('Corpo & Banho', 'Produtos para cuidados corporais e banho')
ON CONFLICT DO NOTHING;

-- Update products with category
UPDATE public.products SET category_id = (
  SELECT id FROM public.categories WHERE name = 'Corpo & Banho' LIMIT 1
) WHERE category_id IS NULL;