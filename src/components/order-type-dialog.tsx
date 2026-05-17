'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Warehouse } from 'lucide-react';

interface OrderTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTypeDialog({ isOpen, onClose }: OrderTypeDialogProps) {
  const router = useRouter();

  const handleSelection = (type: 'delivery' | 'pickup') => {
    onClose();
    if (type === 'delivery') {
      router.push('/addresses?flow=checkout');
    } else {
      router.push(`/checkout?type=pickup`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">إتمام الطلب</DialogTitle>
          <DialogDescription className="text-center">
            كيف تود استلام طلبك؟
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-6">
          <Card
            onClick={() => handleSelection('delivery')}
            className="cursor-pointer hover:bg-muted/80 transition-colors"
          >
            <CardContent className="flex flex-col items-center justify-center p-6 gap-3 text-center">
              <Truck className="w-12 h-12 text-primary" />
              <p className="font-semibold text-lg">طلب توصيل</p>
              <p className="text-xs text-muted-foreground">سنوصل طلبك إلى باب بيتك.</p>
            </CardContent>
          </Card>
          <Card
            onClick={() => handleSelection('pickup')}
            className="cursor-pointer hover:bg-muted/80 transition-colors"
          >
            <CardContent className="flex flex-col items-center justify-center p-6 gap-3 text-center">
              <Warehouse className="w-12 h-12 text-primary" />
              <p className="font-semibold text-lg">حجز (استلام من الفرع)</p>
              <p className="text-xs text-muted-foreground">استلم طلبك بنفسك من المطعم.</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
