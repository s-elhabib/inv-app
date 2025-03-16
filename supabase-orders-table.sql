-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) NOT NULL,
  total_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON public.orders
  FOR ALL USING (true);

-- Create index for better performance
CREATE INDEX orders_client_id_idx ON public.orders(client_id);

-- Modify sales table to reference orders
ALTER TABLE public.sales 
ADD COLUMN order_id uuid REFERENCES public.orders(id);

-- Create index for the new relationship
CREATE INDEX sales_order_id_idx ON public.sales(order_id);