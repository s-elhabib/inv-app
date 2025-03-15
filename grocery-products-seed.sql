-- First, clear existing data if needed
TRUNCATE public.products CASCADE;
TRUNCATE public.categories CASCADE;

-- Insert categories
INSERT INTO public.categories (id, name)
VALUES 
  (gen_random_uuid(), 'Dairy'),
  (gen_random_uuid(), 'Produce'),
  (gen_random_uuid(), 'Bakery'),
  (gen_random_uuid(), 'Meat'),
  (gen_random_uuid(), 'Beverages')
ON CONFLICT (name) DO NOTHING;

-- Now insert products with category_id
INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Whole Milk 1L', 
  id, 
  800, 
  1200, 
  50, 
  'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'
FROM public.categories WHERE name = 'Dairy';