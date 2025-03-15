-- Create products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) NOT NULL,
  price integer NOT NULL,
  sellingPrice integer NOT NULL,
  stock integer NOT NULL,
  image text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Set up Row Level Security (optional but recommended)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations" ON public.products
  FOR ALL USING (true);

-- Add the missing sellingPrice column to the products table
ALTER TABLE public.products 
ADD COLUMN "sellingPrice" integer NOT NULL;

-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON public.categories
  FOR ALL USING (true);

-- Insert default categories
INSERT INTO public.categories (name) VALUES
  ('Food'),
  ('Drink');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  name text,
  email text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write their own profile
CREATE POLICY "Users can manage their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Create index for better performance
CREATE INDEX products_category_id_idx ON public.products(category_id);

