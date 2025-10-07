'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast.tsx';
import { Trash2 } from 'lucide-react';

interface CurrenciesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type Currency = {
  id: number;
  name: string;
  symbol: string;
  exchange_rate_to_main: number;
  is_main_currency: boolean;
};

export function CurrenciesModal({ isOpen, onClose }: CurrenciesModalProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [formState, setFormState] = useState<Partial<Omit<Currency, 'id' | 'is_main_currency'>>>({ name: '', symbol: '', exchange_rate_to_main: undefined });
  const { toast } = useToast();
  
  const fetchCurrencies = async () => {
      try {
          const response = await fetch('/api/currencies');
          if (!response.ok) throw new Error('Failed to fetch currencies');
          const data = await response.json();
          setCurrencies(data.map((c: any) => ({...c, exchange_rate_to_main: parseFloat(c.exchange_rate_to_main)})));
      } catch (error) {
          toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب العملات.' });
      }
  };

  useEffect(() => {
    if (isOpen) {
        fetchCurrencies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCurrency) {
      setFormState({
        name: selectedCurrency.name,
        symbol: selectedCurrency.symbol,
        exchange_rate_to_main: selectedCurrency.exchange_rate_to_main,
      });
    } else {
      resetForm();
    }
  }, [selectedCurrency]);

  const resetForm = () => {
    setFormState({ name: '', symbol: '', exchange_rate_to_main: undefined });
    setSelectedCurrency(null);
  };
  
  const handleInputChange = (field: keyof typeof formState, value: string | number) => {
    setFormState(prev => ({...prev, [field]: value}));
  };

  const handleSave = async () => {
    if (!formState.name || !formState.symbol || formState.exchange_rate_to_main === undefined || formState.exchange_rate_to_main < 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع الحقول بسعر صرف صحيح.' });
      return;
    }
    
    const isEditing = !!selectedCurrency;
    const url = isEditing ? `/api/currencies/${selectedCurrency.id}` : '/api/currencies';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formState, exchange_rate_to_main: Number(formState.exchange_rate_to_main) })
        });
        if (!response.ok) throw new Error('فشل حفظ العملة');
        toast({ title: 'تم بنجاح', description: `تم ${isEditing ? 'تحديث' : 'إضافة'} العملة.` });
        fetchCurrencies();
        resetForm();
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    }
  };

  const handleDelete = async () => {
    if (selectedCurrency && !selectedCurrency.is_main_currency) {
      try {
          const response = await fetch(`/api/currencies/${selectedCurrency.id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('فشل حذف العملة');
          toast({ title: 'تم الحذف' });
          fetchCurrencies();
          resetForm();
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'خطأ', description: e.message });
      }
    }
  };

  const handleSetMain = async () => {
    if (!selectedCurrency || selectedCurrency.is_main_currency) {
        return;
    }
    try {
        const response = await fetch(`/api/currencies/${selectedCurrency.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formState, is_main_currency: true })
        });
        if (!response.ok) throw new Error('فشل تعيين العملة الرئيسية');
        toast({ title: 'تم التحديث', description: `تم تعيين ${selectedCurrency.name} كعملة رئيسية.` });
        fetchCurrencies();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    }
  };


  const mainCurrency = currencies.find(c => c.is_main_currency);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="bg-primary p-4 rounded-t-lg -m-6 mb-6">
          <DialogTitle className="text-2xl text-primary-foreground">إدارة العملات</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedCurrency ? 'تعديل عملة' : 'إضافة عملة جديدة'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency-name">اسم العملة</Label>
                <Input id="currency-name" value={formState.name || ''} onChange={e => handleInputChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency-symbol">رمز العملة</Label>
                <Input id="currency-symbol" value={formState.symbol || ''} onChange={e => handleInputChange('symbol', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchange-rate">سعر الصرف (مقابل {mainCurrency?.symbol})</Label>
                <Input id="exchange-rate" type="number" value={formState.exchange_rate_to_main ?? ''} onChange={e => handleInputChange('exchange_rate_to_main', e.target.value === '' ? undefined : parseFloat(e.target.value))} disabled={selectedCurrency?.is_main_currency} />
              </div>
              <div className="flex justify-between items-center gap-2 pt-2">
                 <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white flex-1">حفظ</Button>
                 {selectedCurrency && !selectedCurrency.is_main_currency && (
                    <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
                 )}
                 <Button variant="ghost" onClick={resetForm}>جديد</Button>
              </div>
              {selectedCurrency && !selectedCurrency.is_main_currency && (
                <Button onClick={handleSetMain} className="w-full bg-amber-600 hover:bg-amber-700">تعيين كعملة رئيسية</Button>
              )}
            </CardContent>
          </Card>
          
          {/* Table */}
          <div className="h-96">
            <ScrollArea className="h-full rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary/90">
                    <TableHead className="text-primary-foreground text-center">العملة</TableHead>
                    <TableHead className="text-primary-foreground text-center">الرمز</TableHead>
                    <TableHead className="text-primary-foreground text-center">سعر الصرف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow
                      key={currency.id}
                      onClick={() => setSelectedCurrency(currency)}
                      className={cn(
                        'cursor-pointer hover:bg-muted/50',
                        selectedCurrency?.id === currency.id && 'bg-primary/20',
                        currency.is_main_currency && 'font-bold text-amber-500'
                      )}
                    >
                      <TableCell className="text-center">{currency.name} {currency.is_main_currency && '(رئيسية)'}</TableCell>
                      <TableCell className="text-center">{currency.symbol}</TableCell>
                      <TableCell className="text-center">{currency.exchange_rate_to_main.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="p-4 bg-card border-t -m-6 mt-6">
          <Button variant="secondary" onClick={onClose}>رجوع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
