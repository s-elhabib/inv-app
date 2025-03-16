import React, { createContext, useState, useContext } from 'react';

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  stock: number;
  quantity?: number;
  categoryName?: string;
  price?: number;
  image?: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface OrderContextType {
  selectedProducts: Product[];
  setSelectedProducts: (products: Product[]) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedClientName: string | null;
  setSelectedClientName: (name: string | null) => void;
  addToOrder: (product: Product) => void;
  removeFromOrder: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearOrder: () => void;
  calculateTotal: () => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);

  const addToOrder = (product: Product) => {
    setSelectedProducts(current => {
      const existingProduct = current.find(p => p.id === product.id);
      if (existingProduct) {
        return current.map(p =>
          p.id === product.id
            ? { ...p, quantity: (p.quantity || 0) + 1 }
            : p
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const removeFromOrder = (productId: string) => {
    setSelectedProducts(current =>
      current.filter(p => p.id !== productId)
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(current =>
      current.map(p =>
        p.id === productId
          ? { ...p, quantity: quantity }
          : p
      )
    );
  };

  const clearOrder = () => {
    setSelectedProducts([]);
    setSelectedClientId(null);
    setSelectedClientName(null);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.sellingPrice * (product.quantity || 0));
    }, 0);
  };

  return (
    <OrderContext.Provider value={{
      selectedProducts,
      setSelectedProducts,
      selectedClientId,
      setSelectedClientId,
      selectedClientName,
      setSelectedClientName,
      addToOrder,
      removeFromOrder,
      updateQuantity,
      clearOrder,
      calculateTotal
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}