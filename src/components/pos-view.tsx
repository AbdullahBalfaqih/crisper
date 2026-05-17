'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { OrderItem, Product, Category, InventoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Search, Trash2, ArrowLeft, Ticket, XCircle } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast.tsx';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

const mockCoupons: any[] = [];

interface PosViewProps {
  orderItems: OrderItem[];
  onAddToOrder: (product: Product, availableQuantity: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateNotes: (productId: string, notes: string) => void;
  onRemoveFromOrder: (productId: string) => void;
  onProcessPayment: () => void;
  onNavigateToDashboard: () => void;
  discount: number;
  onSetDiscount: (value: number) => void;
  setRefreshCallback: (callback: () => void) => void;
}

export function PosView({
  orderItems,
  onAddToOrder,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveFromOrder,
  onProcessPayment,
  onNavigateToDashboard,
  discount,
  onSetDiscount,
  setRefreshCallback,
}: PosViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
        const [prodRes, catRes, invRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/categories'),
            fetch('/api/inventory'),
        ]);
        if (!prodRes.ok || !catRes.ok || !invRes.ok) throw new Error('Failed to fetch data');
        
        setProducts(await prodRes.json());
        setCategories(await catRes.json());
        setInventory(await invRes.json());

    } catch (error) {
        toast({
          variant: "destructive",
          title: "فشل تحميل البيانات",
          description: "لم نتمكن من تحميل المنتجات والفئات. يرجى المحاولة مرة أخرى.",
        });
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    setRefreshCallback(() => fetchData);
  }, [fetchData, setRefreshCallback]);
  
  const getInventoryQuantity = (productId: string) => {
    return inventory.find(item => item.productId === productId)?.quantity || 0;
  }

  const filteredProducts = products.filter(p => {
    const categoryMatch = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });
  
  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal - discount;
  
  const handleApplyCoupon = () => {
    const coupon = mockCoupons.find(c => c.id.toUpperCase() === couponCode.toUpperCase());
    if (coupon) {
        if (coupon.type === 'percentage') {
            onSetDiscount((subtotal * coupon.value) / 100);
        } else {
            onSetDiscount(coupon.value);
        }
        toast({ title: 'تم تطبيق القسيمة', description: `تم تطبيق خصم ${coupon.value}${coupon.type === 'percentage' ? '%' : 'ر.ي'}.` });
    } else {
        toast({ variant: 'destructive', title: 'خطأ', description: 'كود القسيمة غير صالح.' });
    }
  };


  return (
    <div className="flex h-screen flex-col">
       <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNavigateToDashboard}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
        </Button>
        <h1 className="text-lg font-semibold md:text-xl">نقطة البيع</h1>
      </header>
      <main className="flex flex-1 flex-col md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-4 p-4">
        <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="البحث في المنتجات"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="كل الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفئات</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pr-4">
              {filteredProducts.map(product => {
                const availableQuantity = getInventoryQuantity(product.id);
                const isOutOfStock = availableQuantity <= 0;
                return (
                    <Card
                    key={product.id}
                    className={cn(
                        "overflow-hidden cursor-pointer hover:border-primary transition-colors group relative",
                        isOutOfStock && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !isOutOfStock && onAddToOrder(product, availableQuantity)}
                    >
                    {isOutOfStock && <Badge variant="destructive" className="absolute top-2 right-2 z-10">غير متوفر</Badge>}
                    <Badge className="absolute top-2 left-2 z-10" variant="secondary">المتاح: {availableQuantity}</Badge>
                    <CardContent className="p-0">
                        <div className="relative aspect-[4/3] w-full">
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            data-ai-hint={product.imageHint || 'food item'}
                        />
                        {!isOutOfStock && (
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <PlusCircle className="h-10 w-10 text-white/70 group-hover:text-white group-hover:scale-110 transition-transform" />
                            </div>
                        )}
                        </div>
                    </CardContent>
                    <CardHeader className="p-3">
                        <CardTitle className="text-base text-right">{product.name}</CardTitle>
                    </CardHeader>
                    <CardFooter className="p-3 pt-0">
                        <p className="font-semibold text-primary">{product.price.toLocaleString('ar-SA')} ر.ي</p>
                    </CardFooter>
                    </Card>
                )
            })}
            </div>
          </ScrollArea>
        </div>
        <Card className="flex flex-col mt-4 md:mt-0">
          <CardHeader>
            <CardTitle>الطلب الحالي</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-25rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">العنصر</TableHead>
                    <TableHead className="w-[80px] text-center">الكمية</TableHead>
                    <TableHead className="text-center">السعر</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.length > 0 ? (
                    orderItems.map(item => {
                      const maxQuantity = (getInventoryQuantity(item.id) || 0) + (orderItems.find(i => i.id === item.id)?.quantity || 0);
                      return (
                      <React.Fragment key={item.id}>
                        <TableRow>
                          <TableCell className="font-medium pt-4 text-center">{item.name}</TableCell>
                          <TableCell className="pt-4">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => onUpdateQuantity(item.id, Math.min(maxQuantity, parseInt(e.target.value) || 0))}
                              className="h-8 w-16 text-center"
                              min="0"
                              max={maxQuantity}
                            />
                          </TableCell>
                                  <TableCell className="text-center pt-4">{(item.price * item.quantity).toLocaleString('ar-SA')} ر.ي</TableCell>
                          <TableCell className="pt-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemoveFromOrder(item.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} className="py-0 pb-3 text-center">
                              <Input 
                                placeholder="إضافة ملاحظات للمطبخ..."
                                value={item.notes || ''}
                                onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                                className="h-8 text-xs border-dashed"
                              />
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                        انقر على منتج لإضافته إلى الطلب.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 p-4 border-t">
             <div className="flex justify-between items-center text-lg font-semibold">
                <span>الإجمالي</span>
                <span>{total.toLocaleString('ar-SA')} ر.ي</span>
            </div>
            <Button size="lg" onClick={onProcessPayment} disabled={orderItems.length === 0}>
              إتمام الدفع
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
