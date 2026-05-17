'use client';

import React from 'react';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Image as ImageIcon } from 'lucide-react';

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'out-for-delivery' | 'completed' | 'rejected';
export type OrderType = 'delivery' | 'pickup';

type OrderItemWithNotes = {
    name: string;
    notes: string;
    quantity: number;
    price: number;
};

export type OnlineOrder = {
  id: string;
  type: OrderType;
  customer_name: string;
  customer_phone: string;
  date: Date;
  payment_method: string;
  payment_status: 'paid' | 'unpaid';
  items: OrderItemWithNotes[];
  total: number;
  status: OrderStatus;
  payment_proof_url: string;
  address_id: string;
  address_details?: string;
  latitude?: string;
  longitude?: string;
  order_notes?: string;
  driver_name?: string;
  driver_commission?: number;
};

interface OrderDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  order: OnlineOrder | null;
}

export function OrderDetailsSheet({ isOpen, onClose, order }: OrderDetailsSheetProps) {
  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-card text-card-foreground p-0 flex flex-col">
        <SheetHeader className="p-6 bg-primary text-primary-foreground">
          <SheetTitle className="text-2xl">تفاصيل الطلب: {order.id}</SheetTitle>
          <SheetDescription className="text-primary-foreground/80">
            عرض تفاصيل إثبات الدفع.
          </SheetDescription>
        </SheetHeader>
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-background">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <ImageIcon />
              إثبات الدفع
            </h4>
            <div className="relative w-full h-[80vh] rounded-lg overflow-hidden border-2 border-border bg-muted">
              {order.payment_proof_url ? (
                <Image src={order.payment_proof_url} alt="إثبات الدفع" layout="fill" objectFit="contain" />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>لا يوجد إثبات دفع لهذا الطلب.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <SheetFooter className="p-4 bg-card border-t border-border">
          <Button onClick={onClose} className="w-full" variant="outline">إغلاق</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
