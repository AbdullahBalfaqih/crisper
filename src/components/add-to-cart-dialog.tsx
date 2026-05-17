'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, ShoppingCart, Heart, Copy } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/hooks/use-cart.tsx';
import { useToast } from '@/hooks/use-toast.tsx';
import { useAuth } from '@/hooks/use-auth';


interface AddToCartDialogProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToCartDialog({ product, isOpen, onClose }: AddToCartDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  const fetchFavoriteStatus = useCallback(async () => {
    if (user && product) {
        try {
            const favRes = await fetch(`/api/favorites?userId=${user.id}`);
            if (favRes.ok) {
                const favorites: Product[] = await favRes.json();
                setIsFavorite(favorites.some(fav => fav.id === product.id));
            }
        } catch (error) {
            console.error("Failed to fetch favorite status", error);
        }
    }
  }, [user, product]);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
      fetchFavoriteStatus();
    }
  }, [isOpen, fetchFavoriteStatus]);
  
   const toggleFavorite = async () => {
    if (!user || !product) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب تسجيل الدخول لإضافة المفضلة.' });
      return;
    }

    const method = isFavorite ? 'DELETE' : 'POST';
    const url = isFavorite 
      ? `/api/favorites?userId=${user.id}&productId=${product.id}`
      : '/api/favorites';
    
    try {
      const response = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? JSON.stringify({ userId: user.id, productId: product.id }) : null,
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast({ description: isFavorite ? 'تمت الإزالة من المفضلة.' : 'تمت الإضافة إلى المفضلة.' });
      } else {
        throw new Error('Failed to update favorites');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث المفضلة.' });
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      const productUrl = window.location.origin + `/product/${product.id}`;
      await navigator.clipboard.writeText(productUrl);
      toast({
        title: 'تم نسخ الرابط',
        description: 'يمكنك الآن مشاركة رابط المنتج.',
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في نسخ الرابط.',
      });
    }
  };


  const handleAddToCart = () => {
    addToCart({ ...product, quantity, notes });
    toast({
      title: 'تمت الإضافة إلى السلة',
      description: `${quantity} x ${product.name}`,
    });
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <div className="flex justify-between items-start">
                <div>
                  <DialogTitle>{product.name}</DialogTitle>
                  <DialogDescription>
                    حدد الكمية وأضف ملاحظاتك الخاصة.
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={toggleFavorite}>
                        <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleShare}>
                        <Copy className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-center">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={150}
              height={150}
              className="rounded-lg object-cover"
              data-ai-hint={product.imageHint}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button size="icon" variant="outline" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                <Minus />
              </Button>
              <span className="text-2xl font-bold w-10 text-center">{quantity}</span>
              <Button size="icon" onClick={() => setQuantity(q => q + 1)}>
                <Plus />
              </Button>
            </div>
            <p className="text-3xl font-bold text-primary">
              {(product.price * quantity).toFixed(2)}
              <span className="text-base ml-1">ر.ي</span>
            </p>
          </div>
          <div>
            <Textarea
              placeholder="ملاحظات خاصة (اختياري)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleAddToCart} className="w-full">
            أضف إلى السلة
            <ShoppingCart className="mr-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
