
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast.tsx';
import { Ticket, PlusCircle, Trash2, Edit, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Coupon = { 
  id: string; 
  type: 'percentage' | 'amount'; 
  value: number; 
  max_uses: number; 
  times_used: number; 
  is_active: boolean;
  expiry_date?: Date;
};
type FormState = Partial<Omit<Coupon, 'times_used' | 'is_active'>>;

export function CouponsModal({ isOpen, onClose }: CouponsModalProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formState, setFormState] = useState<FormState>({ type: 'percentage', value: 0, max_uses: 0 });
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/coupons');
        if (!response.ok) throw new Error('Failed to fetch coupons');
        const data = await response.json();
        setCoupons(data);
    } catch(e) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب القسائم.' });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
        fetchCoupons();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCoupon) {
      setFormState({
        id: selectedCoupon.id,
        type: selectedCoupon.type,
        value: selectedCoupon.value,
        max_uses: selectedCoupon.max_uses,
        expiry_date: selectedCoupon.expiry_date,
      });
    } else {
      resetForm();
    }
  }, [selectedCoupon]);


  const resetForm = () => {
    setFormState({ id: '', type: 'percentage', value: 0, max_uses: 0, expiry_date: undefined });
    setSelectedCoupon(null);
  };

  const handleInputChange = (field: keyof FormState, value: string | number | Date | undefined) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formState.id || !formState.type || formState.value === undefined || formState.max_uses === undefined) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع الحقول.' });
      return;
    }
    
    setIsLoading(true);
    const isEditing = !!selectedCoupon;
    const url = isEditing ? `/api/coupons/${selectedCoupon.id}` : '/api/coupons';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formState)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save coupon');
        }
        toast({ title: 'تم الحفظ بنجاح' });
        resetForm();
        await fetchCoupons();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ في الحفظ', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedCoupon) {
      setIsLoading(true);
      try {
          const response = await fetch(`/api/coupons/${selectedCoupon.id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete coupon');
          toast({ title: 'تم الحذف' });
          resetForm();
          await fetchCoupons();
      } catch (e) {
          toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف القسيمة.' });
      } finally {
          setIsLoading(false);
      }
    }
    setIsAlertOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          <DialogHeader className="p-4 bg-primary text-primary-foreground">
            <DialogTitle className="text-2xl flex items-center gap-2"><Ticket /> إدارة القسائم الشرائية</DialogTitle>
          </DialogHeader>

          <div className="flex-1 grid md:grid-cols-2 gap-6 p-6 overflow-y-auto">
            {/* Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{selectedCoupon ? `تعديل القسيمة: ${selectedCoupon.id}` : 'إضافة قسيمة جديدة'}</h3>
              <div className="space-y-2">
                <Label htmlFor="coupon-id">كود القسيمة</Label>
                <Input id="coupon-id" value={formState.id || ''} onChange={e => handleInputChange('id', e.target.value)} disabled={!!selectedCoupon} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon-type">نوع الخصم</Label>
                  <Select value={formState.type} onValueChange={(val: 'percentage' | 'amount') => handleInputChange('type', val)}>
                    <SelectTrigger id="coupon-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                      <SelectItem value="amount">مبلغ ثابت (ر.ي)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-value">قيمة الخصم</Label>
                  <Input id="coupon-value" type="number" value={formState.value || ''} onChange={e => handleInputChange('value', Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-max-uses">الحد الأقصى للاستخدام</Label>
                <Input id="coupon-max-uses" type="number" value={formState.max_uses || ''} onChange={e => handleInputChange('max_uses', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-date">تاريخ الانتهاء (اختياري)</Label>
                <Input id="expiry-date" type="date" value={formState.expiry_date ? new Date(formState.expiry_date).toISOString().split('T')[0] : ''} onChange={e => handleInputChange('expiry_date', e.target.value ? new Date(e.target.value) : undefined)} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">{selectedCoupon ? <Edit /> : <PlusCircle />} {selectedCoupon ? 'حفظ التعديلات' : 'إضافة قسيمة'}</Button>
                <Button onClick={resetForm} variant="ghost">جديد</Button>
                {selectedCoupon && <Button variant="destructive" size="icon" onClick={() => setIsAlertOpen(true)}><Trash2 /></Button>}
              </div>
            </div>

            {/* Table */}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold mb-4">القسائم المتاحة</h3>
              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="text-center">الكود</TableHead>
                      <TableHead className="text-center">النوع</TableHead>
                      <TableHead className="text-center">القيمة</TableHead>
                      <TableHead className="text-center">الاستخدام</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map(coupon => (
                      <TableRow key={coupon.id} onClick={() => setSelectedCoupon(coupon)} className={cn('cursor-pointer', selectedCoupon?.id === coupon.id && 'bg-primary/10')}>
                        <TableCell className="font-mono text-center">{coupon.id}</TableCell>
                        <TableCell className="text-center">{coupon.type === 'percentage' ? 'نسبة' : 'مبلغ'}</TableCell>
                        <TableCell className="text-center">{coupon.value}{coupon.type === 'percentage' ? '%' : ' ر.ي'}</TableCell>
                        <TableCell className="text-center">{coupon.times_used} / {coupon.max_uses}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد أنك تريد حذف هذه القسيمة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
