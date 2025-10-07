'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.tsx';
import type { OnlineOrder } from './order-details-sheet';

// Simplified Driver type for this component's purpose
type DriverInfo = {
    name: string;
    phone: string;
}

interface AssignDriverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (order: OnlineOrder, driver: DriverInfo, commission: number) => void;
  order: OnlineOrder | null;
}

export function AssignDriverDialog({ isOpen, onClose, onAssign, order }: AssignDriverDialogProps) {
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [commission, setCommission] = useState<number>(1000);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setDriverName('');
      setDriverPhone('');
      setCommission(1000);
    }
  }, [isOpen]);

  const handleAssignClick = () => {
    if (!driverName) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال اسم السائق.' });
      return;
    }
    
    if (order) {
      onAssign(order, { name: driverName, phone: driverPhone }, commission);
    } else {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم العثور على الطلب المحدد.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>إسناد مهمة توصيل</DialogTitle>
          <DialogDescription>
            أدخل بيانات السائق لإسناد الطلب رقم {order?.id}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driver-name">اسم السائق</Label>
            <Input id="driver-name" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="مثال: أحمد خالد" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="driver-phone">رقم هاتف السائق (اختياري)</Label>
            <Input id="driver-phone" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="77XXXXXXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission-input">عمولة التوصيل (ر.ي)</Label>
            <Input
              id="commission-input"
              type="number"
              value={commission}
              onChange={e => setCommission(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleAssignClick}>إسناد المهمة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
