'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Landmark, Save, PlusCircle } from 'lucide-react';
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


interface BanksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type Bank = {
  id: number;
  name: string;
  iban: string;
  balance: number;
};

export function BanksModal({ isOpen, onClose }: BanksModalProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [formState, setFormState] = useState<Omit<Bank, 'id'>>({ name: '', iban: '', balance: 0 });
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const fetchBanks = async () => {
    try {
        const response = await fetch('/api/banks');
        if (!response.ok) {
            throw new Error('Failed to fetch banks');
        }
        const data = await response.json();
        setBanks(data.map((b: any) => ({...b, balance: parseFloat(b.balance)})));
    } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة البنوك.' });
    }
  };

  useEffect(() => {
    if (isOpen) {
        fetchBanks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedBank) {
      setFormState({
        name: selectedBank.name,
        iban: selectedBank.iban,
        balance: selectedBank.balance,
      });
    } else {
      resetForm();
    }
  }, [selectedBank]);

  const resetForm = () => {
    setFormState({ name: '', iban: '', balance: 0 });
    setSelectedBank(null);
  };
  
  const handleInputChange = (field: keyof typeof formState, value: string | number) => {
    setFormState(prev => ({...prev, [field]: value}));
  };

  const handleSave = async () => {
    if (!formState.name) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال اسم البنك.' });
      return;
    }
    
    const isEditing = !!selectedBank;
    const url = isEditing ? `/api/banks/${selectedBank.id}` : '/api/banks';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formState, balance: Number(formState.balance) })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save bank');
        }

        toast({ title: 'تم الحفظ', description: `تم ${isEditing ? 'تحديث' : 'إضافة'} البنك بنجاح.` });
        fetchBanks();
        resetForm();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ في الحفظ', description: error.message });
    }
  };

  const handleDelete = async () => {
    if (selectedBank) {
       try {
            await fetch(`/api/banks/${selectedBank.id}`, { method: 'DELETE' });
            toast({ title: 'تم الحذف', description: `تم حذف ${selectedBank.name}.` });
            fetchBanks();
            resetForm();
       } catch (error) {
           toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف البنك.' });
       }
      setIsAlertOpen(false);
    }
  };
  
  const totalBalance = banks.reduce((acc, bank) => acc + bank.balance, 0);


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="bg-primary p-4 rounded-t-lg -m-6 mb-6">
          <DialogTitle className="text-2xl text-primary-foreground flex items-center gap-2"><Landmark/> إدارة البنوك والشبكات</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedBank ? 'تعديل بيانات البنك' : 'إضافة بنك جديد'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank-name">اسم البنك</Label>
                <Input id="bank-name" value={formState.name} onChange={e => handleInputChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-iban">رقم الحساب (IBAN)</Label>
                <Input id="bank-iban" value={formState.iban} onChange={e => handleInputChange('iban', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-balance">الرصيد الافتتاحي</Label>
                <Input id="bank-balance" type="number" value={formState.balance || ''} onChange={e => handleInputChange('balance', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center gap-2 pt-2">
                 <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white flex-1"><Save className="ml-2"/>{selectedBank ? 'حفظ التعديلات' : 'حفظ البنك'}</Button>
                 {selectedBank && (
                    <Button variant="destructive" onClick={() => setIsAlertOpen(true)}><Trash2 /></Button>
                 )}
                 <Button variant="ghost" onClick={resetForm}><PlusCircle className="ml-2"/>جديد</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Table */}
          <div className="h-96 flex flex-col">
            <ScrollArea className="flex-1 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary/90">
                    <TableHead className="text-primary-foreground text-center">اسم البنك</TableHead>
                    <TableHead className="text-primary-foreground text-center">الرصيد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banks.map((bank) => (
                    <TableRow
                      key={bank.id}
                      onClick={() => setSelectedBank(bank)}
                      className={cn('cursor-pointer hover:bg-muted/50', selectedBank?.id === bank.id && 'bg-primary/20')}
                    >
                      <TableCell className="text-center font-semibold">{bank.name}</TableCell>
                      <TableCell className="text-center font-mono">{bank.balance.toLocaleString('ar-SA')} ر.ي</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
             <div className="mt-4 p-4 bg-card rounded-lg border text-center">
                <p className="text-lg">إجمالي أرصدة البنوك: <span className="font-bold text-green-600">{totalBalance.toLocaleString('ar-SA')} ر.ي</span></p>
             </div>
          </div>
        </div>
        
        <DialogFooter className="p-4 bg-card border-t -m-6 mt-6">
          <Button variant="secondary" onClick={onClose}>رجوع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
            هل أنت متأكد أنك تريد حذف {selectedBank?.name}؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            حذف
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
