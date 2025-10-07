'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast.tsx';
import { format } from 'date-fns';
import { Plus, Trash2, CheckCircle, Printer, FileDown, UserCheck, ListX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DebtInvoice } from './debt-invoice';
import { generateDebtsHtmlReport } from '@/app/export/actions';
import { DebtStatement } from './debt-statement';


type Debt = {
  id: number;
  person: string;
  amount: number;
  currency: string;
  type: 'مدين' | 'دائن';
  dueDate: Date;
  status: 'مسدد' | 'غير مسدد';
};

interface DebtsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = {
  person: string;
  newPerson: string;
  amount: number;
  currency: string;
  type: 'مدين' | 'دائن';
};

type User = { 
  id: string; 
  full_name: string;
  username: string; 
  email: string; 
  role: 'system_admin' | 'employee' | 'customer';
};


export function DebtsModal({ isOpen, onClose }: DebtsModalProps) {
  const [data, setData] = useState<Debt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [formState, setFormState] = useState<FormState>({ person: '', newPerson: '', amount: 0, currency: 'ر.ي', type: 'دائن' });
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertAction, setAlertAction] = useState<'delete' | 'clear' | 'settle' | null>(null);

  const { toast } = useToast();
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const statementPrintRef = useRef<HTMLDivElement>(null);

   const fetchDebts = useCallback(async () => {
    try {
      const response = await fetch('/api/debts');
      if (!response.ok) throw new Error('Failed to fetch debts');
      const debtsData = await response.json();
      setData(debtsData.map((d: any) => ({ ...d, amount: parseFloat(d.amount), dueDate: new Date(d.due_date), person: d.person_name })));
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة الديون.' });
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchDebts();
      const fetchUsers = async () => {
        try {
          const response = await fetch('/api/users');
          if (!response.ok) throw new Error('Failed to fetch users');
          const usersData: User[] = await response.json();
          setUsers(usersData);
        } catch (error) {
          toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة المستخدمين.' });
        }
      };
      fetchUsers();
      const fetchLogo = async () => {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const settings = await response.json();
                if (settings.logo_base64) {
                    setLogo(settings.logo_base64);
                }
            }
        } catch (error) {
            console.error("Failed to fetch logo for receipt", error);
        }
      };
      fetchLogo();
    }
  }, [isOpen, toast, fetchDebts]);


  const resetForm = () => {
    setFormState({ person: '', newPerson: '', amount: 0, currency: 'ر.ي', type: 'دائن' });
  };
  
  const handleInputChange = (field: keyof FormState, value: string | number) => {
    setFormState(prev => ({...prev, [field]: value}));
  };
  
   const handleSelectChange = (value: string) => {
    setFormState(prev => ({ ...prev, person: value, newPerson: '' }));
  };

  const handleAddClick = async () => {
    const personName = formState.newPerson.trim() || formState.person;
    if (!personName || !formState.amount) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد شخص أو إدخال اسم جديد، وتحديد المبلغ.' });
      return;
    }

    try {
        const response = await fetch('/api/debts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                person_name: personName,
                amount: formState.amount,
                currency: formState.currency,
                type: formState.type,
                due_date: new Date(),
            }),
        });
        if (!response.ok) throw new Error('Failed to save debt');
        
        await fetchDebts();
        
        toast({ title: "تم بنجاح", description: "تمت إضافة الدين وتسجيله في الصندوق."});
        resetForm();
    } catch(e) {
        toast({ variant: "destructive", title: "خطأ", description: "فشلت عملية إضافة الدين."});
    }
  };
  
  const handlePrint = (type: 'invoice' | 'statement') => {
      let node: HTMLDivElement | null = null;
      let title = '';

      if (type === 'invoice') {
          if (!selectedDebt) {
              toast({variant: "destructive", title: "خطأ", description: "يرجى تحديد دين لطباعة فاتورته."});
              return;
          }
          node = invoicePrintRef.current;
          title = `فاتورة دين رقم ${selectedDebt.id}`;
      } else if (type === 'statement') {
          if (!personFilter) {
               toast({variant: "destructive", title: "خطأ", description: "يرجى عرض كشف حساب لشخص أولاً."});
              return;
          }
          node = statementPrintRef.current;
          title = `كشف حساب - ${personFilter}`;
      }
      
      if (node) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>${title}</title>`);
            printWindow.document.write('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">');
             printWindow.document.write('<style>@page { size: 80mm auto; margin: 0; } body { font-family: "Almarai", sans-serif; direction: rtl; } </style>');
            printWindow.document.write('</head><body>' + node.innerHTML + '</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
      }
  };


  const openConfirmationDialog = (action: 'delete' | 'clear' | 'settle') => {
    if (!selectedDebt && (action === 'delete' || action === 'settle')) {
        toast({ variant: 'destructive', title: "خطأ", description: "يرجى تحديد دين أولاً."});
        return;
    }
    setAlertAction(action);
    setIsAlertOpen(true);
  };
  
  const handleConfirmAction = async () => {
    if (alertAction === 'delete' && selectedDebt) {
        try {
            const response = await fetch(`/api/debts/${selectedDebt.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete debt');
            await fetchDebts();
            toast({ title: 'تم الحذف', description: `تم حذف الدين رقم ${selectedDebt.id}.`});
            setSelectedDebt(null);
        } catch(e) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الدين.'});
        }
    } else if (alertAction === 'clear') {
        // Implement bulk delete API if needed
        toast({ title: 'غير متاح', description: 'تفريغ السجل غير مدعوم حاليًا.'});
    } else if (alertAction === 'settle' && selectedDebt) {
        try {
            const response = await fetch(`/api/debts/${selectedDebt.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'مسدد' }),
            });
            if (!response.ok) throw new Error('Failed to settle debt');
            
            await fetchDebts();

            toast({ title: 'تم التسديد', description: `تم تسديد الدين رقم ${selectedDebt.id} وتسجيله في الصندوق.`});
        } catch(e) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تسديد الدين.'});
        }
    }

    setIsAlertOpen(false);
    setAlertAction(null);
  };

  const handleShowStatement = () => {
      if (selectedDebt) {
          setPersonFilter(selectedDebt.person);
          toast({title: "تم عرض كشف الحساب", description: `يتم الآن عرض الديون الخاصة بـ ${selectedDebt.person} فقط.`})
      } else {
          toast({variant: "destructive", title: "خطأ", description: "يرجى تحديد دين لعرض كشف حساب صاحبه."})
      }
  }

  const handleExport = async () => {
    toast({ title: 'جاري إنشاء التقرير...', description: 'يتم تجهيز تقرير HTML بالديون الحالية.' });
    try {
      const reportHtml = await generateDebtsHtmlReport(displayedData);
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = personFilter ? `debts-report-${personFilter}.html` : 'debts-report-all.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل تقرير الديون.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
    }
  }

  const displayedData = useMemo(() => {
    if (personFilter) {
        return data.filter(d => d.person === personFilter);
    }
    return data;
  }, [data, personFilter]);

  const { totalDebtor, totalCreditor, totalUnpaidDebtor, totalUnpaidCreditor } = useMemo(() => {
    return displayedData.reduce((acc, debt) => {
        if (debt.type === 'مدين') {
            acc.totalDebtor += debt.amount;
            if (debt.status === 'غير مسدد') acc.totalUnpaidDebtor += debt.amount;
        } else {
            acc.totalCreditor += debt.amount;
            if (debt.status === 'غير مسدد') acc.totalUnpaidCreditor += debt.amount;
        }
        return acc;
    }, { totalDebtor: 0, totalCreditor: 0, totalUnpaidDebtor: 0, totalUnpaidCreditor: 0 });
  }, [displayedData]);

  const getAlertDialogContent = () => {
    switch (alertAction) {
        case 'delete': return { title: 'تأكيد حذف الدين', description: 'هل أنت متأكد أنك تريد حذف هذا الدين نهائياً؟' };
        case 'clear': return { title: 'تأكيد تفريغ الديون', description: 'هل أنت متأكد أنك تريد حذف جميع الديون؟' };
        case 'settle': return { title: 'تأكيد تسديد الدين', description: 'هل أنت متأكد أنك تريد تسديد هذا الدين؟' };
        default: return { title: 'تأكيد الإجراء', description: 'هل أنت متأكد؟' };
    }
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-4">
          <DialogHeader className="p-2 bg-primary text-primary-foreground -m-4 mb-4 p-4">
            <DialogTitle className="text-2xl">إدارة الذمم والديون</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
                إدارة ديون العملاء والموظفين والموردين وتسويتها.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="-mx-4 flex-1">
          <div className="grid md:grid-cols-12 gap-6 p-4">
            
            {/* Table */}
            <div className="md:col-span-8 flex flex-col h-full rounded-lg border bg-card">
                {personFilter && (
                    <div className="p-2 border-b flex justify-between items-center bg-primary/10">
                        <span className="font-semibold">عرض كشف حساب لـ: {personFilter}</span>
                        <Button variant="ghost" size="sm" onClick={() => setPersonFilter(null)}>
                            <ListX className="ml-2 h-4 w-4"/>
                            عرض كل الديون
                        </Button>
                    </div>
                )}
                <ScrollArea className="h-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-primary">
                                <TableHead className="text-primary-foreground text-center">رقم الدين</TableHead>
                                <TableHead className="text-primary-foreground text-center">المبلغ</TableHead>
                                <TableHead className="text-primary-foreground text-center">البيان</TableHead>
                                <TableHead className="text-primary-foreground text-center">تاريخ الاستحقاق</TableHead>
                                <TableHead className="text-primary-foreground text-center">الشخص</TableHead>
                                <TableHead className="text-primary-foreground text-center">الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {displayedData.map((debt) => (
                            <TableRow key={debt.id} onClick={() => setSelectedDebt(debt)} className={cn('cursor-pointer', selectedDebt?.id === debt.id && 'bg-primary/20')}>
                                <TableCell className="text-center font-mono">{debt.id}</TableCell>
                                <TableCell className={cn('text-center font-bold', debt.type === 'مدين' ? 'text-green-500' : 'text-red-500')}>{debt.amount.toLocaleString('ar-SA')} {debt.currency}</TableCell>
                                <TableCell className="text-center">{debt.type === 'مدين' ? 'مبلغ لنا' : 'مبلغ علينا'}</TableCell>
                                <TableCell className="text-center font-mono">{format(debt.dueDate, "yyyy/MM/dd")}</TableCell>
                                <TableCell className="text-center">{debt.person}</TableCell>
                                <TableCell className={cn('text-center font-semibold', debt.status === 'مسدد' ? 'text-green-500' : 'text-yellow-500')}>{debt.status}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
                 <CardFooter className="p-2 border-t flex justify-around items-center text-sm font-semibold">
                    <span>إجمالي المبالغ لنا (غير مسدد): <span className="text-green-600">{totalUnpaidDebtor.toLocaleString('ar-SA')}</span></span>
                    <span>إجمالي المبالغ علينا (غير مسدد): <span className="text-red-600">{totalUnpaidCreditor.toLocaleString('ar-SA')}</span></span>
                  </CardFooter>
            </div>

            {/* Actions Panel */}
            <div className="md:col-span-4 flex flex-col h-full gap-4">
               <Card>
                  <CardHeader><CardTitle>الإجراءات الرئيسية</CardTitle></CardHeader>
                   <CardContent className="grid grid-cols-2 gap-3">
                     <Button onClick={() => openConfirmationDialog('settle')} className="h-16 bg-green-500 hover:bg-green-600" disabled={!selectedDebt}><CheckCircle className="ml-2"/>تسديد الدين المحدد</Button>
                     <Button onClick={() => openConfirmationDialog('delete')} variant="destructive" className="h-16" disabled={!selectedDebt}><Trash2 className="ml-2"/>حذف الدين المحدد</Button>
                     <Button onClick={() => handlePrint('invoice')} className="h-16" disabled={!selectedDebt}><Printer className="ml-2"/>طباعة الفاتورة</Button>
                     <Button onClick={handleShowStatement} className="h-16" disabled={!selectedDebt}><UserCheck className="ml-2"/>كشف حساب</Button>
                     <Button onClick={() => handlePrint('statement')} className="h-16" disabled={!personFilter}><Printer className="ml-2" />طباعة الكشف</Button>
                     <Button onClick={handleExport} className="h-16"><FileDown className="ml-2"/>تصدير HTML</Button>
                     <Button onClick={() => openConfirmationDialog('clear')} variant="outline" className="h-16 border-destructive text-destructive hover:bg-destructive hover:text-white col-span-2"><ListX className="ml-2"/>تفريغ السجل</Button>
                   </CardContent>
                </Card>
                <Card className="mt-auto">
                     <CardHeader><CardTitle>إضافة دين جديد</CardTitle></CardHeader>
                     <CardContent className="space-y-4">
                         <div className="space-y-2">
                             <Label>اسم الشخص</Label>
                             <Select value={formState.person} onValueChange={handleSelectChange}>
                                 <SelectTrigger><SelectValue placeholder="اختر مستخدم أو موظف..." /></SelectTrigger>
                                 <SelectContent>
                                     {users.map(user => <SelectItem key={user.id} value={user.full_name}>{user.full_name}</SelectItem>)}
                                 </SelectContent>
                             </Select>
                             <div className="relative">
                               <div className="absolute inset-0 flex items-center">
                                 <span className="w-full border-t" />
                               </div>
                               <div className="relative flex justify-center text-xs uppercase">
                                 <span className="bg-card px-2 text-muted-foreground">أو</span>
                               </div>
                             </div>
                             <Input 
                                placeholder="أدخل اسم جديد..." 
                                value={formState.newPerson}
                                onChange={(e) => handleInputChange('newPerson', e.target.value)}
                                onFocus={() => handleInputChange('person', '')}
                            />
                         </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">المبلغ المستحق</Label>
                                <Input id="amount" type="number" value={formState.amount || ''} onChange={(e) => handleInputChange('amount', Number(e.target.value))}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="currency">العملة</Label>
                                <Select value={formState.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                                    <SelectTrigger id="currency">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ر.ي">ريال يمني</SelectItem>
                                        <SelectItem value="ر.س">ريال سعودي</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                         </div>
                        <RadioGroup value={formState.type} onValueChange={(val: 'مدين' | 'دائن') => handleInputChange('type', val)} className="flex justify-around pt-2">
                            <div className="flex items-center gap-x-2">
                                <RadioGroupItem value="مدين" id="type-debtor" />
                                <Label htmlFor="type-debtor" className="text-green-600 font-semibold">مبلغ لنا (مدين)</Label>
                            </div>
                             <div className="flex items-center gap-x-2">
                                <RadioGroupItem value="دائن" id="type-creditor" />
                                <Label htmlFor="type-creditor" className="text-red-600 font-semibold">مبلغ علينا (دائن)</Label>
                            </div>
                        </RadioGroup>
                     </CardContent>
                     <CardFooter>
                         <Button onClick={handleAddClick} className="w-full h-12"><Plus className="ml-2"/>إضافة الدين للسجل</Button>
                     </CardFooter>
                </Card>
            </div>
          </div>
          </ScrollArea>
          <div className="flex justify-start p-2 mt-auto border-t">
            <Button onClick={onClose} variant="ghost" className="h-12 px-6">رجوع</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        {selectedDebt && <DebtInvoice ref={invoicePrintRef} debt={selectedDebt} logo={logo} />}
        {personFilter && <DebtStatement ref={statementPrintRef} person={personFilter} debts={displayedData} logo={logo} />}
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getAlertDialogContent().title}</AlertDialogTitle>
            <AlertDialogDescription>{getAlertDialogContent().description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} className={cn(alertAction !== 'settle' && "bg-destructive hover:bg-destructive/90")}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
