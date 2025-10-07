'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Check, Hourglass, Utensils, Bike, Loader2, ServerCrash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useSearchParams } from 'next/navigation';
import type { OnlineOrder as FullOrderDetails, OrderStatus } from '@/components/order-details-sheet';
import { Button } from '@/components/ui/button';

type StatusStep = {
    id: OrderStatus;
    label: string;
    icon: React.ElementType;
};

const statusSteps: StatusStep[] = [
  { id: 'completed', label: 'تم التوصيل', icon: Check },
  { id: 'out-for-delivery', label: 'الطلب في الطريق', icon: Bike },
  { id: 'ready', label: 'الطلب جاهز', icon: Check },
  { id: 'preparing', label: 'جاري تحضير الطلب', icon: Utensils },
  { id: 'new', label: 'تم الاستلام', icon: Check },
];


export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<Partial<FullOrderDetails> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchOrderStatus = useCallback(async () => {
    if (!orderId) {
        setError("رقم الطلب غير موجود.");
        setLoading(false);
        return;
    }
    
    try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (!res.ok) {
            if (res.status === 404) throw new Error("لم يتم العثور على الطلب.");
            throw new Error("فشل في جلب حالة الطلب.");
        }
        const data = await res.json();
        setOrder(data);
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderStatus();
    
    // Set up polling to refresh order status
    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [fetchOrderStatus]);
  
  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (error || !order) {
    return (
         <div className="flex h-screen w-full items-center justify-center bg-background text-center">
            <div>
                <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold">حدث خطأ</h1>
                <p className="text-muted-foreground">{error || "لا يمكن عرض تفاصيل الطلب."}</p>
                 <Link href="/">
                    <Button variant="link" className="mt-4">العودة إلى الرئيسية</Button>
                </Link>
            </div>
        </div>
    );
  }
  
  const currentStatusIndex = statusSteps.findIndex(step => step.id === order.status);
  const progressValue = currentStatusIndex >= 0 ? ((statusSteps.length - 1 - currentStatusIndex) / (statusSteps.length - 1)) * 100 : 0;
  
  return (
    <div className="bg-background min-h-screen font-body text-foreground pb-20">
      <div className="container mx-auto max-w-lg p-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/" className="p-2">
            <ArrowRight size={24} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            تتبع طلبك الحالي
            <ShoppingBag />
          </h1>
          <div className="w-8"></div>
        </header>

        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <p className="text-muted-foreground">رقم الطلب: #{order.id}</p>
              <h2 className="text-2xl font-bold text-primary">
                {statusSteps.find(s => s.id === order.status)?.label || 'جاري المعالجة'}
              </h2>
            </div>
            
            <div className="mb-8">
                <Progress value={progressValue} className="w-full h-2" dir="ltr" />
                <div className="flex justify-between mt-2">
                    {statusSteps.map((step, index) => {
                        const stepIndexFromTheEnd = statusSteps.length - 1 - index;
                        const currentStatusIndexFromTheEnd = statusSteps.length - 1 - currentStatusIndex;
                        const isCompleted = currentStatusIndexFromTheEnd >= stepIndexFromTheEnd;
                        
                        return(
                        <div key={step.id} className="flex flex-col items-center flex-1">
                            <div
                                className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                                isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border'
                                )}
                            >
                                <step.icon className="h-5 w-5" />
                            </div>
                            <p className={cn("text-xs mt-2 text-center", isCompleted ? 'text-primary font-semibold' : 'text-muted-foreground')}>{step.label}</p>
                        </div>
                    )})}
                </div>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
                <p>الوقت المقدر للوصول: <span className="font-bold text-foreground">15-25 دقيقة</span></p>
                {order.type === 'delivery' && order.driver_name && (
                    <p>السائق: <span className="font-bold text-foreground">{order.driver_name}</span></p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
