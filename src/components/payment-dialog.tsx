'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Delete, CreditCard, Landmark, Handshake, Monitor, Loader2, Ticket, XCircle } from 'lucide-react';
import type { OrderItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast.tsx';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import type { Bank } from './banks-modal';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from './ui/scroll-area';


interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentMethod: PaymentMethod, bankName?: string, orderDetails?: any) => void;
  orderItems: OrderItem[];
  discount: number;
  onSetDiscount: (value: number) => void;
}

export type PaymentMethod = 'نقدي' | 'بطاقة' | 'شبكة' | 'ضيافة' | 'تحويل بنكي';

type User = { 
  id: string; 
  full_name: string;
  role: 'system_admin' | 'employee' | 'customer';
};

const mockCoupons: any[] = [];

export function PaymentDialog({ isOpen, onClose, onPaymentSuccess, orderItems, discount, onSetDiscount }: PaymentDialogProps) {
  const { user } = useAuth();
  const [paidAmountStr, setPaidAmountStr] = useState('0');
  const [guestName, setGuestName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [personnel, setPersonnel] = useState<User[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('نقدي');
  const [isInputDirty, setIsInputDirty] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const { toast } = useToast();
  
  const subtotal = useMemo(() => orderItems.reduce((total, item) => total + item.price * item.quantity, 0), [orderItems]);
  const totalAmount = useMemo(() => subtotal - discount, [subtotal, discount]);
  const paidAmount = useMemo(() => parseFloat(paidAmountStr) || 0, [paidAmountStr]);
  const dueAmount = useMemo(() => paidAmount - totalAmount, [paidAmount, totalAmount]);

  useEffect(() => {
    if (isOpen) {
      setPaidAmountStr('0');
      setActiveMethod('نقدي');
      setGuestName('');
      setSelectedBank('');
      setCustomerName('');
      setIsInputDirty(false);
      setIsProcessing(false);
      setCouponCode('');
      onSetDiscount(0);

      const fetchInitialData = async () => {
          try {
              const [banksRes, usersRes] = await Promise.all([
                  fetch('/api/banks'),
                  fetch('/api/users')
              ]);
              if (banksRes.ok) setBanks(await banksRes.json());
              if (usersRes.ok) setPersonnel(await usersRes.json());
          } catch (e) {
              console.error("Failed to fetch data for payment dialog", e);
          }
      }
      fetchInitialData();

    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (activeMethod === 'نقدي') {
      if (paidAmount < totalAmount) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'المبلغ المدفوع أقل من المبلغ الإجمالي.',
        });
        return;
      }
    }
    
    if (activeMethod === 'شبكة' && !selectedBank) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى تحديد البنك الذي تمت عبره عملية الدفع.',
      });
      return;
    }
    
    if (activeMethod === 'ضيافة' && !guestName.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى إدخال اسم الشخص المسؤول عن الضيافة.',
      });
      return;
    }

    setIsProcessing(true);

    const orderPayload = {
        userId: user?.id || null,
        total_amount: subtotal,
        discount_amount: discount,
        final_amount: totalAmount,
        payment_method: activeMethod,
        payment_status: activeMethod === 'ضيافة' ? 'unpaid' : 'paid',
        items: orderItems,
        type: 'pickup', // Explicitly set order type
        bankName: activeMethod === 'شبكة' ? selectedBank : null,
        order_notes: activeMethod === 'ضيافة' ? `ضيافة: ${guestName}` : '',
        customer_name: customerName || (activeMethod === 'ضيافة' ? guestName : null),
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'فشل في إنشاء الطلب');
        }
        
        const newOrder = await response.json();
        
        toast({ title: 'تم الدفع بنجاح', description: `تم تسجيل الطلب #${newOrder.id}.`});
        onPaymentSuccess(activeMethod, selectedBank, newOrder);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'فشل العملية', description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };
  
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

  const handleNumpadClick = (value: string) => {
    if (value === '.' && paidAmountStr.includes('.')) return;
    
    let newValue;
    if (!isInputDirty || paidAmountStr === '0') {
      newValue = value === '.' ? '0.' : value;
      setIsInputDirty(true);
    } else {
      newValue = paidAmountStr + value;
    }
    setPaidAmountStr(newValue);
  };
  
  const handleBackspace = () => {
    setPaidAmountStr(prev => prev.slice(0, -1) || '0');
    setIsInputDirty(true);
  };
  
  const handleClearInput = () => {
    setPaidAmountStr('0');
    setIsInputDirty(false);
  }

  const handleQuickAmountClick = (amount: number) => {
    setPaidAmountStr(amount.toString());
    setIsInputDirty(true);
  };

  const quickAmounts = useMemo(() => [
    Math.ceil(totalAmount),
    Math.ceil(totalAmount / 5) * 5,
    Math.ceil(totalAmount / 10) * 10,
    Math.ceil(totalAmount / 50) * 50,
  ].filter((v, i, a) => a.indexOf(v) === i && v > totalAmount && v < 1000).sort((a,b) => a-b).slice(0, 4), [totalAmount]);
  
  const numpadKeys = [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '000' ];

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { id: 'نقدي', label: 'نقدي', icon: CreditCard },
    { id: 'شبكة', label: 'شبكة', icon: Monitor },
    { id: 'بطاقة', label: 'بطاقة', icon: Landmark },
    { id: 'ضيافة', label: 'ضيافة', icon: Handshake },
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 md:grid md:grid-cols-2 max-h-[90vh] overflow-y-auto md:overflow-hidden">
        <div className="p-6 flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle>إتمام الدفع</DialogTitle>
            <DialogDescription>اختر طريقة الدفع وأكمل العملية.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {paymentMethods.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeMethod === id ? 'default' : 'outline'}
                className="h-16 flex-col text-base"
                onClick={() => setActiveMethod(id)}
              >
                <Icon className="h-6 w-6 mb-1" />
                {label}
              </Button>
            ))}
          </div>

          {activeMethod === 'ضيافة' ? (
              <div className="space-y-2 mb-4 animate-in fade-in-50">
                <Label htmlFor="guestName">اسم الضيف/المسؤول</Label>
                 <Select value={guestName} onValueChange={setGuestName}>
                    <SelectTrigger id="guestName">
                        <SelectValue placeholder="اختر موظف أو عميل..." />
                    </SelectTrigger>
                    <SelectContent>
                        {personnel.map(p => (
                            <SelectItem key={p.id} value={p.full_name}>{p.full_name} ({p.role === 'employee' ? 'موظف' : 'عميل'})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
          ) : activeMethod === 'شبكة' ? (
              <div className="space-y-2 mb-4 animate-in fade-in-50">
                <Label htmlFor="bank-select">تحديد البنك</Label>
                 <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger id="bank-select">
                        <SelectValue placeholder="اختر البنك" />
                    </SelectTrigger>
                    <SelectContent>
                        {banks.map(bank => (
                            <SelectItem key={bank.id} value={bank.name}>{bank.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
          ): (
             <div className="space-y-2 mb-4 animate-in fade-in-50">
                <Label htmlFor="customerName">اسم العميل (اختياري)</Label>
                <Input id="customerName" placeholder="أدخل اسم العميل..." value={customerName} onChange={e => setCustomerName(e.target.value)} />
             </div>
          )}

            <div className="space-y-2 mb-4">
                <Label>الخصم والقسائم</Label>
                 <div className="flex items-center gap-2">
                    <Input
                        id="discount"
                        type="number"
                        value={discount}
                        onChange={(e) => onSetDiscount(parseFloat(e.target.value) || 0)}
                        className="h-9 w-24 text-left"
                        min="0"
                        placeholder="الخصم"
                        disabled={orderItems.length === 0}
                    />
                     <Input
                        id="coupon"
                        placeholder="أو أدخل كود قسيمة"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        className="h-9 flex-1"
                        disabled={orderItems.length === 0}
                     />
                     <Button variant="outline" size="icon" onClick={handleApplyCoupon} disabled={!couponCode}><Ticket /></Button>
                </div>
            </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2 mt-auto">
               <div className="flex justify-between items-center text-lg">
                  <span className="text-muted-foreground">المبلغ الإجمالي</span>
                  <span className="font-bold">{totalAmount.toFixed(2)} ر.ي</span>
              </div>
               <div className={cn("flex justify-between items-center text-lg", activeMethod !== 'نقدي' && 'opacity-50')}>
                  <span className="text-muted-foreground">المبلغ المدفوع</span>
                  <span className="font-bold">{paidAmount.toFixed(2)} ر.ي</span>
              </div>
               <div className={cn("flex justify-between items-center text-xl font-bold text-primary", activeMethod !== 'نقدي' && 'opacity-50')}>
                  <span>{dueAmount >= 0 ? 'الباقي' : 'المستحق'}</span>
                  <span>{dueAmount.toFixed(2)} ر.ي</span>
              </div>
          </div>
        </div>
        
        <div className="bg-muted/30 p-6 flex flex-col rounded-r-lg md:rounded-l-lg md:rounded-r-none">
           <div className={cn("grid grid-cols-4 gap-2 mb-4", activeMethod !== 'نقدي' && 'opacity-25 pointer-events-none')}>
              {quickAmounts.map(amount => (
                  <Button key={amount} variant="outline" className="h-12 text-lg" onClick={() => handleQuickAmountClick(amount)}>
                      {amount} ر.ي
                  </Button>
              ))}
          </div>

          <div className={cn("grid grid-cols-3 gap-2", activeMethod !== 'نقدي' && 'opacity-25 pointer-events-none')}>
              {numpadKeys.map(key => (
                   <Button key={key} variant="outline" className="h-12 text-2xl font-bold bg-background" onClick={() => handleNumpadClick(key)}>
                      {key}
                  </Button>
              ))}
               <Button variant="outline" className="h-12 text-2xl font-bold bg-background" onClick={handleBackspace}>
                  <Delete />
              </Button>
              <Button variant="outline" className="h-12 text-2xl font-bold bg-background" onClick={handleClearInput}>
                  <XCircle />
              </Button>
          </div>

          <DialogFooter className="!justify-between mt-auto pt-6">
            <Button variant="ghost" size="lg" onClick={onClose} disabled={isProcessing}>
              إلغاء
            </Button>
            <Button size="lg" onClick={handlePayment} className="w-48" disabled={isProcessing}>
               {isProcessing ? <Loader2 className="animate-spin" /> : 'إتمام الدفع'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
