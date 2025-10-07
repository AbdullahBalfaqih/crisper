'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, FileDown, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { generateExpensesReportHtml } from '@/app/export/actions';
import type { Transaction } from './accounting-fund-modal';
import { useAuth } from '@/hooks/use-auth';

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Expense = Transaction & { recipient?: string };
type FormState = Partial<Omit<Expense, 'id' | 'transaction_date' | 'type' | 'classification' | 'user_id' | 'branch_id'> & { transaction_date?: Date }>;

export function ExpensesModal({ isOpen, onClose }: ExpensesModalProps) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formState, setFormState] = useState<FormState>({ transaction_date: new Date(), amount: 0, recipient: '', description: '', currency: 'ر.ي' });
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertAction, setAlertAction] = useState<'delete' | 'clear' | null>(null);
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data.map((d: any) => ({ ...d, amount: parseFloat(d.amount), transaction_date: new Date(d.transaction_date) })));
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة المصروفات.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchExpenses();
    }
  }, [isOpen, fetchExpenses]);
  
  useEffect(() => {
    if (selectedExpense) {
      setFormState({
          ...selectedExpense,
          transaction_date: new Date(selectedExpense.transaction_date),
      });
    } else {
      resetForm();
    }
  }, [selectedExpense]);
  
  const filteredData = useMemo(() => {
    return expenses.filter(expense => {
      if (!dateRange?.from) return true;
      const toDate = dateRange.to || dateRange.from;
      const expenseDate = new Date(expense.transaction_date);
      expenseDate.setHours(0, 0, 0, 0);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDateEnd = new Date(toDate);
      toDateEnd.setHours(23, 59, 59, 999);
      
      return expenseDate >= fromDate && expenseDate <= toDateEnd;
    });
  }, [expenses, dateRange]);


  const resetForm = () => {
    setFormState({ transaction_date: new Date(), amount: 0, recipient: '', description: '', currency: 'ر.ي' });
    setSelectedExpense(null);
  };
  
  const handleInputChange = (field: keyof FormState, value: any) => {
    setFormState(prev => ({...prev, [field]: value}));
  };

  const handleSave = async () => {
    if (!formState.amount || !formState.description) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع الحقول.' });
      return;
    }

    const isEditing = !!selectedExpense;
    const url = isEditing ? `/api/expenses/${selectedExpense.id}` : '/api/expenses';
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
        amount: formState.amount,
        currency: formState.currency,
        description: formState.description,
        recipient: formState.recipient,
        transaction_date: formState.transaction_date,
        user_id: user?.id,
    };

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save expense');
        }
        
        toast({ title: 'تم الحفظ بنجاح', description: isEditing ? 'تم تعديل المصروف بنجاح' : 'تم إضافة المصروف بنجاح' });
        resetForm();
        fetchExpenses();
    } catch(e: any) {
        toast({ variant: "destructive", title: "خطأ", description: e.message || "فشلت عملية حفظ المصروف."});
    }
  };

  const handleDeleteClick = () => {
    if (!selectedExpense) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد مصروف لحذفه.' });
      return;
    }
    setAlertAction('delete');
    setIsAlertOpen(true);
  };
  
  const handleClearClick = () => {
    setAlertAction('clear');
    setIsAlertOpen(true);
  };

  const handleConfirmAlert = async () => {
    if (alertAction === 'delete' && selectedExpense) {
        try {
            const response = await fetch(`/api/expenses/${selectedExpense.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete expense');
            toast({ title: 'تم الحذف', description: `تم حذف المصروف.` });
            resetForm();
            fetchExpenses();
        } catch(e) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المصروف."});
        }
    } else if (alertAction === 'clear') {
        try {
            const response = await fetch('/api/expenses', { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to clear expenses');
            toast({ title: 'تم التفريغ', description: 'تم تفريغ جميع المصروفات.'});
            fetchExpenses();
        } catch(e) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل تفريغ المصروفات."});
        }
    }
    setIsAlertOpen(false);
    setAlertAction(null);
  };

  const totalExpensesByCurrency = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      if (!acc[curr.currency]) {
        acc[curr.currency] = 0;
      }
      acc[curr.currency] += curr.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredData]);
  
  const handleExport = async () => {
    toast({ title: 'جاري إنشاء التقرير...', description: 'يتم تجهيز تقرير HTML بالمصروفات الحالية.' });
    try {
      const reportableData = filteredData.map(d => ({
          id: d.id,
          date: new Date(d.transaction_date),
          recipient: d.recipient || 'N/A',
          amount: d.amount,
          description: d.description || '',
          currency: d.currency,
      }));
      const reportHtml = await generateExpensesReportHtml(reportableData);
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses-report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل تقرير المصروفات.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-4">
          <DialogHeader className="bg-primary p-4 -m-4 mb-2 text-primary-foreground">
            <DialogTitle className="text-2xl">إدارة المصروفات</DialogTitle>
            <DialogDescription className="text-primary-foreground/90">إضافة وتعديل المصروفات المختلفة مثل الرواتب والنفقات اليومية.</DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-6 pt-2 flex-1 overflow-y-auto pr-2">
            {/* Form Panel */}
            <div className="md:col-span-1 flex flex-col gap-6">
              <div className="bg-card p-6 rounded-lg border flex-1">
                <h3 className="text-lg font-semibold mb-4">{selectedExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="exp-date">تاريخ الصرف</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-right font-normal",
                                !formState.transaction_date && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {formState.transaction_date ? format(formState.transaction_date, "PPP") : <span>اختر تاريخ</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={formState.transaction_date} onSelect={(d) => handleInputChange('transaction_date', d)} initialFocus />
                        </PopoverContent>
                    </Popover>
                  </div>
                   <div className="space-y-1">
                    <Label htmlFor="exp-amount">المبلغ المصروف</Label>
                    <Input id="exp-amount" type="number" value={formState.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="exp-recipient">جهة الصرف</Label>
                    <Input id="exp-recipient" value={formState.recipient || ''} onChange={e => handleInputChange('recipient', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="exp-description">البيان</Label>
                    <Input id="exp-description" value={formState.description || ''} onChange={e => handleInputChange('description', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="exp-currency">العملة</Label>
                    <Select value={formState.currency} onValueChange={(val) => handleInputChange('currency', val)}>
                        <SelectTrigger id="exp-currency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ر.ي">ريال يمني</SelectItem>
                            <SelectItem value="ر.س">ريال سعودي</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600 text-white mt-2">{selectedExpense ? 'حفظ التعديلات' : 'إضافة مصروف'}</Button>
                </div>
              </div>
            </div>

            {/* Table Panel */}
            <div className="md:col-span-2 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-right font-normal", !dateRange && "text-muted-foreground")}>
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>اختر نطاق التاريخ</span>)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" onClick={handleExport}><FileDown className="ml-2 h-4 w-4"/> تصدير</Button>
              </div>
               <div className="flex-1 rounded-lg overflow-hidden border bg-card relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-muted/50 bg-primary">
                        <TableHead className="text-primary-foreground text-center">م</TableHead>
                        <TableHead className="text-primary-foreground text-center">تاريخ المصروف</TableHead>
                        <TableHead className="text-primary-foreground text-center">جهة الصرف</TableHead>
                        <TableHead className="text-primary-foreground text-center">المبلغ</TableHead>
                        <TableHead className="text-primary-foreground text-center">البيان</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((exp) => (
                        <TableRow
                          key={exp.id}
                          onClick={() => setSelectedExpense(exp)}
                          className={cn('cursor-pointer', selectedExpense?.id === exp.id && 'bg-primary/20')}
                        >
                          <TableCell className="text-center">{exp.id}</TableCell>
                          <TableCell className="text-center">{format(exp.transaction_date, "yyyy/MM/dd hh:mm a")}</TableCell>
                          <TableCell className="text-center">{exp.recipient}</TableCell>
                          <TableCell className="text-center">{exp.amount.toFixed(2)} {exp.currency}</TableCell>
                          <TableCell className="text-center">{exp.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
              <div className="mt-4 p-4 bg-card rounded-lg border flex justify-between items-center">
                <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDeleteClick} disabled={!selectedExpense}>حذف مصروف</Button>
                    <Button variant="destructive" onClick={handleClearClick} >تفريغ كل المصروفات</Button>
                </div>
                 <div className="text-lg font-bold text-red-500">
                    <span>إجمالي المصروفات: </span>
                    {Object.entries(totalExpensesByCurrency).map(([currency, total]) => (
                        <span key={currency} className="mr-4">{total.toLocaleString('ar-SA')} {currency}</span>
                    ))}
                 </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-auto pt-4 border-t">
            <Button variant="secondary" onClick={onClose}>رجوع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
                {alertAction === 'delete' ? 'تأكيد الحذف' : 'تأكيد التفريغ'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertAction === 'delete' ? `هل أنت متأكد أنك تريد حذف هذا المصروف؟` : `هل أنت متأكد أنك تريد تفريغ كل المصروفات؟`} لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAlert} className="bg-destructive hover:bg-destructive/90">
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
