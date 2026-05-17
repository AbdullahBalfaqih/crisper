'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { OrderItem } from '@/lib/types';

interface CartContextType {
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (itemId: string, notes?: string) => void;
  updateQuantity: (itemId: string, quantity: number, notes?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const item = window.localStorage.getItem('cart');
      if (item) {
        setCart(JSON.parse(item));
      }
    } catch (error) {
      console.error('Failed to parse cart from localStorage', error);
      setCart([]);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        window.localStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Failed to save cart to localStorage', error);
      }
    }
  }, [cart, isMounted]);

  const addToCart = (itemToAdd: OrderItem) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.id === itemToAdd.id && item.notes === itemToAdd.notes
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        const newQuantity = newCart[existingItemIndex].quantity + itemToAdd.quantity;
        newCart[existingItemIndex] = { ...newCart[existingItemIndex], quantity: newQuantity };
        return newCart;
      } else {
        return [...prevCart, itemToAdd];
      }
    });
  };

  const removeFromCart = (itemId: string, notes?: string) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === itemId && item.notes === notes)));
  };

  const updateQuantity = (itemId: string, quantity: number, notes?: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        (item.id === itemId && item.notes === notes) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = { cart, addToCart, removeFromCart, updateQuantity, clearCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
