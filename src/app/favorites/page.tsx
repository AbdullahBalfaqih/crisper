'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';


export default function FavoritesPage() {
    const { user, loading: authLoading } = useAuth();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchFavorites = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/favorites?userId=${user.id}`);
            if (response.ok) {
                setFavorites(await response.json());
            } else {
                 toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب المفضلة.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ أثناء جلب المفضلة.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading) {
            fetchFavorites();
        }
    }, [authLoading, fetchFavorites]);

    const handleRemoveFavorite = async (productId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if(!user) return;
        
        try {
            const response = await fetch(`/api/favorites?userId=${user.id}&productId=${productId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setFavorites(prev => prev.filter(p => p.id !== productId));
                toast({ description: "تمت إزالة المنتج من المفضلة." });
            } else {
                throw new Error("Failed to remove favorite");
            }
        } catch(error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إزالة المنتج من المفضلة.' });
        }
    }


  return (
    <div className="bg-background min-h-screen font-body text-foreground pb-20">
      <div className="container mx-auto max-w-lg p-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/account" className="p-2">
            <ArrowRight size={24} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            المفضلة
            <Heart />
          </h1>
          <div className="w-8"></div>
        </header>

        {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary"/>
                <p className="mt-4">جاري تحميل المفضلة...</p>
            </div>
        ) : favorites.length > 0 ? (
            <div className="space-y-4">
                {favorites.map(product => (
                    <Link href={`/product/${product.id}`} key={product.id} className="block">
                        <div className="bg-card p-3 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <Image src={product.imageUrl} alt={product.name} width={80} height={80} className="rounded-lg object-cover" data-ai-hint={product.imageHint}/>
                             <div className="flex-1">
                                <p className="font-bold text-lg">{product.name}</p>
                                <p className="text-primary font-semibold">{product.price.toFixed(2)} ر.ي</p>
                             </div>
                             <Button variant="ghost" size="icon" onClick={(e) => handleRemoveFavorite(product.id, e)}>
                                <Trash2 className="text-destructive"/>
                             </Button>
                        </div>
                    </Link>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 text-muted-foreground">
                <Heart size={48} className="mx-auto mb-4"/>
                <p className="font-semibold text-lg">قائمة المفضلة فارغة.</p>
                <p>أضف المنتجات التي تحبها هنا للوصول إليها بسهولة.</p>
            </div>
        )}
      </div>
    </div>
  );
}
