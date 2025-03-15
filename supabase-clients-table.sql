-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  revenue NUMERIC DEFAULT 0,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users"
ON public.clients
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow insert access for authenticated users
CREATE POLICY "Allow insert access for authenticated users"
ON public.clients
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow update access for authenticated users
CREATE POLICY "Allow update access for authenticated users"
ON public.clients
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow delete access for authenticated users
CREATE POLICY "Allow delete access for authenticated users"
ON public.clients
FOR DELETE
USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO public.clients (name, email, phone, address, status, revenue, image)
VALUES 
  ('Nusantara Restaurant', 'info@nusantara.com', '+62 812 3456 7890', 'Jl. Sudirman No. 123, Jakarta', 'active', 12500, 'https://via.placeholder.com/100'),
  ('Spice Garden', 'contact@spicegarden.com', '+62 813 9876 5432', 'Jl. Gatot Subroto No. 45, Jakarta', 'active', 8300, 'https://via.placeholder.com/100'),
  ('Ocean Delight', 'hello@oceandelight.com', '+62 857 1234 5678', 'Jl. Thamrin No. 67, Jakarta', 'inactive', 6700, 'https://via.placeholder.com/100'),
  ('Urban Bites', 'support@urbanbites.com', '+62 878 8765 4321', 'Jl. Kuningan No. 89, Jakarta', 'active', 5200, 'https://via.placeholder.com/100');