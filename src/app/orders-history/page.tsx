'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Loader2, Package, Check, Utensils, Bike } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { OrderItem } from '@/lib/types';


type Order = {
  id: number;
  date: string;
  total: number;
  status: 'new' | 'preparing' | 'ready' | 'out-for-delivery' | 'completed' | 'rejected';
  items: OrderItem[];
};

const statusConfig = {
    new: { label: 'جديد', icon: Package, color: 'bg-orange-500' },
    preparing: { label: 'قيد التجهيز', icon: Utensils, color: 'bg-blue-500' },
    ready: { label: 'جاهز', icon: Check, color: 'bg-yellow-500' },
    'out-for-delivery': { label: 'قيد التوصيل', icon: Bike, color: 'bg-indigo-500' },
    completed: { label: 'مكتمل', icon: Check, color: 'bg-green-500' },
    rejected: { label: 'مرفوض', icon: Check, color: 'bg-red-500' },
};


export default function OrdersHistoryPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const response = await fetch(`/api/orders?userId=${user.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        setOrders(await response.json());
    } catch(e) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب سجل الطلبات.' });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if(!loading) {
        fetchOrders();
    }
  }, [loading, fetchOrders]);


  return (
    <div className="bg-background min-h-screen font-body text-foreground pb-20">
      <div className="container mx-auto max-w-lg p-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/account" className="p-2">
            <ArrowRight size={24} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            طلباتي السابقة
            <FileText />
          </h1>
          <div className="w-8"></div>
        </header>

        {isLoading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : orders.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
                <p>لا توجد طلبات سابقة لعرضها.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {orders.map(order => {
                    const config = statusConfig[order.status] || statusConfig.new;
                    return (
                        <Card key={order.id} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
                                <div>
                                    <CardTitle>طلب #{order.id}</CardTitle>
                                    <CardDescription>{format(new Date(order.date), "eeee, d MMMM yyyy", { locale: ar })}</CardDescription>
                                </div>
                                <Badge className={cn("text-white", config.color)}>{config.label}</Badge>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <span>{item.quantity} x {item.name}</span>
                                            <span className="text-muted-foreground">{(item.price * item.quantity).toLocaleString('ar-SA')} ر.ي</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 p-4 flex justify-end font-bold text-lg">
                                <span>الإجمالي: {order.total.toLocaleString('ar-SA')} ر.ي</span>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
}
