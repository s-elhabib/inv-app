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

-- Insert products with category_id
-- Dairy products
INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Whole Milk 1L', 
  id, 
  800, 
  1200, 
  50, 
  'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'
FROM public.categories WHERE name = 'Dairy';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Cheddar Cheese 250g', 
  id, 
  1500, 
  2200, 
  30, 
  'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400'
FROM public.categories WHERE name = 'Dairy';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Greek Yogurt 500g', 
  id, 
  1200, 
  1800, 
  25, 
  'https://images.unsplash.com/photo-1584278433313-11aa25c65cec?w=400'
FROM public.categories WHERE name = 'Dairy';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Butter 250g', 
  id, 
  1000, 
  1500, 
  40, 
  'https://images.unsplash.com/photo-1589985270958-bf087b2d8ed7?w=400'
FROM public.categories WHERE name = 'Dairy';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Cream Cheese 200g', 
  id, 
  900, 
  1400, 
  20, 
  'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=400'
FROM public.categories WHERE name = 'Dairy';

-- Produce products
INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Tomatoes 1kg', 
  id, 
  600, 
  900, 
  60, 
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'
FROM public.categories WHERE name = 'Produce';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Spinach 250g', 
  id, 
  400, 
  700, 
  35, 
  'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'
FROM public.categories WHERE name = 'Produce';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Avocado (each)', 
  id, 
  500, 
  800, 
  40, 
  'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=400'
FROM public.categories WHERE name = 'Produce';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Potatoes 2kg', 
  id, 
  700, 
  1100, 
  45, 
  'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400'
FROM public.categories WHERE name = 'Produce';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Carrots 1kg', 
  id, 
  300, 
  600, 
  55, 
  'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'
FROM public.categories WHERE name = 'Produce';

-- Bakery products
INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Whole Wheat Bread', 
  id, 
  600, 
  900, 
  25, 
  'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400'
FROM public.categories WHERE name = 'Bakery';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Croissants (4 pack)', 
  id, 
  800, 
  1200, 
  20, 
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'
FROM public.categories WHERE name = 'Bakery';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Chocolate Muffins (6 pack)', 
  id, 
  1000, 
  1500, 
  15, 
  'https://images.unsplash.com/photo-1604882406385-6eb3f9f2c1c9?w=400'
FROM public.categories WHERE name = 'Bakery';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Bagels (6 pack)', 
  id, 
  900, 
  1300, 
  18, 
  'https://images.unsplash.com/photo-1585478259715-4ddc6572944d?w=400'
FROM public.categories WHERE name = 'Bakery';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Cinnamon Rolls (4 pack)', 
  id, 
  1100, 
  1600, 
  12, 
  'https://images.unsplash.com/photo-1583527976767-a17c9c1ce7eb?w=400'
FROM public.categories WHERE name = 'Bakery';

-- Meat products
INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Chicken Breast 1kg', 
  id, 
  1800, 
  2500, 
  30, 
  'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400'
FROM public.categories WHERE name = 'Meat';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Ground Beef 500g', 
  id, 
  1500, 
  2200, 
  25, 
  'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400'
FROM public.categories WHERE name = 'Meat';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Pork Chops 750g', 
  id, 
  1700, 
  2400, 
  20, 
  'https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=400'
FROM public.categories WHERE name = 'Meat';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Salmon Fillet 500g', 
  id, 
  2200, 
  3000, 
  15, 
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400'
FROM public.categories WHERE name = 'Meat';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Beef Steak 400g', 
  id, 
  2500, 
  3500, 
  10, 
  'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=400'
FROM public.categories WHERE name = 'Meat';

-- Beverages products
INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Orange Juice 1L', 
  id, 
  700, 
  1000, 
  40, 
  'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400'
FROM public.categories WHERE name = 'Beverages';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Sparkling Water 6-pack', 
  id, 
  800, 
  1200, 
  35, 
  'https://images.unsplash.com/photo-1606168094336-48f8b0c41288?w=400'
FROM public.categories WHERE name = 'Beverages';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Green Tea 20 bags', 
  id, 
  500, 
  800, 
  50, 
  'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400'
FROM public.categories WHERE name = 'Beverages';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Coffee Beans 250g', 
  id, 
  1200, 
  1800, 
  30, 
  'https://images.unsplash.com/photo-1559525323-cbb5269e4497?w=400'
FROM public.categories WHERE name = 'Beverages';

INSERT INTO public.products (name, category_id, price, "sellingPrice", stock, image)
SELECT 
  'Almond Milk 1L', 
  id, 
  900, 
  1400, 
  25, 
  'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400'
FROM public.categories WHERE name = 'Beverages';