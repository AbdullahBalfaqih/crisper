'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, Minus, Plus, Copy, Star, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useToast } from '@/hooks/use-toast.tsx';
import { useParams } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';


// This is a mock component. In a real app, you'd fetch product by id.
export default function ProductDetailPage() {
  const params = useParams();
  const { id } = params;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProductData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      const products: Product[] = await res.json();
      const foundProduct = products.find(p => p.id === id)
      setProduct(foundProduct || null);

      if (user && foundProduct) {
        const favRes = await fetch(`/api/favorites?userId=${user.id}`);
        const favorites: Product[] = await favRes.json();
        setIsFavorite(favorites.some(fav => fav.id === foundProduct.id));
      }
    } catch (error) {
      console.error("Failed to fetch product data", error);
    } finally {
        setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

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
    if (!product) return;
    addToCart({ ...product, quantity });
    toast({
      title: 'تمت الإضافة إلى السلة',
      description: `${quantity} x ${product.name}`,
    });
  };


  if (isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      );
  }
  
  if (!product) {
    return <div>لم يتم العثور على المنتج.</div>;
  }

  return (
    <div className="bg-background min-h-screen font-body text-foreground pb-20">
      <div className="relative h-80">
        <Image
          src={product.imageUrl}
          alt={product.name}
          layout="fill"
          objectFit="cover"
          className="w-full h-full"
          data-ai-hint={product.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto max-w-lg p-6 -mt-20 relative">
        <div className="bg-card p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleFavorite}>
                <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Copy className="w-6 h-6" />
              </Button>
            </div>
          </div>

          <p className="mt-4 text-muted-foreground">
            {product.description || 'شهي وطازج محضر من أجود المكونات. تجربة لا تنسى من أول قضمة.'}
          </p>

          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-4">
              <Button size="icon" variant="outline" onClick={() => setQuantity(q => Math.max(1, q-1))}>
                <Minus />
              </Button>
              <span className="text-2xl font-bold">{quantity}</span>
              <Button size="icon" onClick={() => setQuantity(q => q + 1)}>
                <Plus />
              </Button>
            </div>
            <p className="text-3xl font-bold text-primary">
              {(product.price * quantity).toLocaleString('ar-SA')}
              <span className="text-base ml-1">ر.ي</span>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Button className="w-full h-14 text-lg" onClick={handleAddToCart}>أضف إلى السلة</Button>
        </div>
      </div>
    </div>
  );
}
