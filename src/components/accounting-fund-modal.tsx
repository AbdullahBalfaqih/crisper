
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, Landmark, FileText, Download, Filter, RefreshCw } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';
import type { ModalType } from './app-container';
import { useToast } from '@/hooks/use-toast.tsx';
import { generateComprehensiveReportHtml } from '@/services/export-comprehensive-report';
import type { Bank } from './banks-modal';
import type { Currency } from './currencies-modal';
import type { Branch } from './branches-modal';
import { useAuth } from '@/hooks/use-auth';

interface AccountingFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  openModal: (modal: ModalType) => void;
}

export type Transaction = {
    id: number;
    transaction_date: Date;
    type: 'revenue' | 'expense';
    classification: 'sales' | 'purchases' | 'debt_payment' | 'expense' | 'salary' | 'other';
    amount: number;
    description: string;
    related_id: string | null;
    user_id: string | null;
    branch_id: string | null;
    currency: string;
};

type User = {
    id: string;
    full_name: string;
};

type FormState = Partial<Omit<Transaction, 'id'>>;

const classificationTranslations: Record<Transaction['classification'], string> = {
    sales: 'مبيعات',
    purchases: 'مشتريات',
    debt_payment: 'سداد دين',
    expense: 'مصروفات عامة',
    salary: 'رواتب',
    other: 'أخرى',
};

const typeTranslations: Record<Transaction['type'], string> = {
    revenue: 'إيراد',
    expense: 'مصروف',
}

export function AccountingFundModal({ isOpen, onClose, openModal }: AccountingFundModalProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logo, setLogo] = useState<string | null>(null);

  const [selectedRow, setSelectedRow] = useState<Transaction | null>(null);
  const [formState, setFormState] = useState<FormState>({});
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertAction, setAlertAction] = useState<'delete' | 'clear' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [transRes, banksRes, currenciesRes, branchesRes, usersRes, settingsRes] = await Promise.all([
            fetch('/api/transactions'),
            fetch('/api/banks'),
            fetch('/api/currencies'),
            fetch('/api/branches'),
            fetch('/api/users'),
            fetch('/api/settings'),
        ]);

        if (!transRes.ok || !banksRes.ok || !currenciesRes.ok || !branchesRes.ok || !usersRes.ok) {
            throw new Error('Failed to fetch initial data');
        }

        const [transData, banksData, currenciesData, branchesData, usersData] = await Promise.all([
            transRes.json(),
            banksRes.json(),
            currenciesRes.json(),
            branchesRes.json(),
            usersRes.json(),
        ]);
        
        if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setLogo(settingsData.logo_base64 || null);
        }

        setTransactions(transData.map((t: any) => ({ ...t, transaction_date: new Date(t.transaction_date), amount: parseFloat(t.amount) })));
        setBanks(banksData.map((b: any) => ({ ...b, balance: parseFloat(b.balance) })));
        setCurrencies(currenciesData.map((c: any) => ({ ...c, exchange_rate_to_main: parseFloat(c.exchange_rate_to_main) })));
        setBranches(branchesData);
        setUsers(usersData);
        
    } catch (error) {
        toast({ variant: 'destructive', title: 'فشل في جلب البيانات', description: 'لم نتمكن من تحميل البيانات اللازمة.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
        fetchAllData();
    }
  }, [isOpen, fetchAllData]);


  const filteredData = useMemo(() => {
    return transactions.filter(transaction => {
      const date = new Date(transaction.transaction_date);
      const dateMatch = !dateRange?.from || (
        date >= startOfDay(dateRange.from) &&
        date <= endOfDay(dateRange.to || dateRange.from)
      );
      const typeMatch = typeFilter === 'all' || transaction.type === typeFilter;
      const currencyMatch = currencyFilter === 'all' || transaction.currency === currencyFilter;
      
      return dateMatch && typeMatch && currencyMatch;
    });
  }, [transactions, dateRange, typeFilter, currencyFilter]);


  useEffect(() => {
    if (selectedRow) {
      setFormState({
        ...selectedRow,
        transaction_date: new Date(selectedRow.transaction_date),
      });
    } else {
      resetForm();
    }
  }, [selectedRow]);

  const resetForm = () => {
    setFormState({
      transaction_date: new Date(),
      amount: 0,
      description: '',
      branch_id: branches.length > 0 ? branches[0].id : null,
      currency: currencies.find(c => c.is_main_currency)?.symbol || 'ر.ي',
      type: 'revenue',
      classification: 'sales',
    });
    setSelectedRow(null);
  };
  
  const handleInputChange = (field: keyof FormState, value: any) => {
    setFormState(prev => ({...prev, [field]: value}));
  };
  
  const handleSave = async () => {
    if (!formState.amount || !formState.description) {
        toast({ variant: 'destructive', title: "خطأ", description: "يرجى ملء المبلغ والوصف." });
        return;
    }
    
    const isEditing = !!selectedRow;
    const url = isEditing ? `/api/transactions/${selectedRow.id}` : '/api/transactions';
    const method = isEditing ? 'PUT' : 'POST';
    
    const payload = { ...formState, user_id: user?.id };
    
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save transaction');
        }
        
        toast({ title: "تم بنجاح", description: `تم ${isEditing ? 'تعديل' : 'إضافة'} الحركة بنجاح.` });
        await fetchAllData();
        resetForm();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };
  
  const handleDeleteClick = () => {
      if (!selectedRow) {
        toast({ variant: 'destructive', title: "خطأ", description: "يرجى تحديد معاملة لحذفها." });
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
    if (alertAction === 'delete' && selectedRow) {
        try {
            await fetch(`/api/transactions/${selectedRow.id}`, { method: 'DELETE' });
            toast({ title: "تم الحذف", description: `تم حذف المعاملة رقم ${selectedRow.id}.` });
            await fetchAllData();
            resetForm();
        } catch (error) {
             toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف المعاملة.' });
        }
    } else if (alertAction === 'clear') {
       try {
            await fetch('/api/transactions', { method: 'DELETE' });
            toast({ title: "تم التفريغ", description: 'تم تفريغ كل الحركات.' });
            await fetchAllData();
       } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تفريغ الحركات.' });
       }
    }
    setIsAlertOpen(false);
    setAlertAction(null);
  };

  const handleGenerateReport = async () => {
      setIsLoading(true);
      toast({title: "جاري إنشاء التقرير...", description: "قد تستغرق هذه العملية بضع لحظات."})
      try {
        const reportData = {
          transactions: filteredData,
          banks,
          currencies,
          branches,
          users,
          logo: logo
        };
        const reportHtml = await generateComprehensiveReportHtml(reportData as any);

        const blob = new Blob([reportHtml], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comprehensive-report.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({title: "اكتمل الإنشاء", description: "تم تنزيل التقرير الشامل بنجاح."});
      } catch (error) {
        console.error("Report generation failed:", error);
        toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء التقرير.' });
      } finally {
        setIsLoading(false);
      }
  }

  const totalsByCurrency = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
        if (!acc[curr.currency]) {
            acc[curr.currency] = { revenue: 0, expenses: 0 };
        }
        if (curr.type === 'revenue') {
            acc[curr.currency].revenue += curr.amount;
        } else if (curr.type === 'expense') {
            acc[curr.currency].expenses += curr.amount;
        }
        return acc;
    }, {} as Record<string, { revenue: number, expenses: number }>);
  }, [filteredData]);


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-2xl">الصندوق المحاسبي</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 px-4 pt-4 border-b pb-4 bg-muted/50">
            <Filter className="h-5 w-5 text-primary" />
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[280px] justify-start text-right font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>فلترة حسب التاريخ</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
             <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="كل الأنواع" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    <SelectItem value="revenue">إيراد</SelectItem>
                    <SelectItem value="expense">مصروف</SelectItem>
                </SelectContent>
            </Select>
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="كل العملات" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل العملات</SelectItem>
                    {currencies.map(c => <SelectItem key={c.id} value={c.symbol}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>
             <Button variant="ghost" onClick={() => { setDateRange(undefined); setTypeFilter('all'); setCurrencyFilter('all'); }}>إعادة تعيين</Button>
        </div>
        <ScrollArea className="flex-1 p-4 -m-4">
          <div className="p-4">
            <Card className="h-96">
                <CardContent className="p-0 h-full">
                    <ScrollArea className="h-full">
                         {isLoading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50 bg-primary">
                                    <TableHead className="text-primary-foreground text-center">معرف</TableHead>
                                    <TableHead className="text-primary-foreground text-center">تاريخ المعاملة</TableHead>
                                    <TableHead className="text-primary-foreground text-center">النوع</TableHead>
                                    <TableHead className="text-primary-foreground text-center">التصنيف</TableHead>
                                    <TableHead className="text-primary-foreground text-center">المبلغ</TableHead>
                                    <TableHead className="text-primary-foreground text-center">الوصف</TableHead>
                                    <TableHead className="text-primary-foreground text-center">معرف مرتبط</TableHead>
                                    <TableHead className="text-primary-foreground text-center">المستخدم</TableHead>
                                    <TableHead className="text-primary-foreground text-center">الفرع</TableHead>
                                    <TableHead className="text-primary-foreground text-center">العملة</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {filteredData.map((row) => (
                                    <TableRow
                                    key={row.id}
                                    onClick={() => setSelectedRow(row)}
                                    className={cn('cursor-pointer', selectedRow?.id === row.id && 'bg-primary/20')}
                                    >
                                        <TableCell className="text-center">{row.id}</TableCell>
                                        <TableCell className="text-center">{format(new Date(row.transaction_date), "PPpp")}</TableCell>
                                        <TableCell className={cn('text-center font-semibold', row.type === 'revenue' ? 'text-green-600' : 'text-red-600')}>{typeTranslations[row.type]}</TableCell>
                                        <TableCell className="text-center">{classificationTranslations[row.classification]}</TableCell>
                                        <TableCell className="text-center font-bold">{row.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">{row.description}</TableCell>
                                        <TableCell className="text-center">{row.related_id}</TableCell>
                                        <TableCell className="text-center">{users.find(u => u.id === row.user_id)?.full_name || row.user_id}</TableCell>
                                        <TableCell className="text-center">{branches.find(b => b.id === row.branch_id)?.name || row.branch_id}</TableCell>
                                        <TableCell className="text-center">{row.currency}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <Card className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="branch">الفرع</Label>
                                <Select value={formState.branch_id?.toString()} onValueChange={(val) => handleInputChange('branch_id', val)}>
                                    <SelectTrigger id="branch"><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">مبلغ المعاملة</Label>
                                <Input id="amount" type="number" placeholder="0.00" value={formState.amount || ''} onChange={(e) => handleInputChange('amount', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="date">التاريخ</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-right font-normal",!formState.transaction_date && "text-muted-foreground")}>
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {formState.transaction_date ? format(formState.transaction_date, "PPP") : <span>اختر تاريخ</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formState.transaction_date} onSelect={(d) => handleInputChange('transaction_date', d)} initialFocus /></PopoverContent>
                                </Popover>
                            </div>
                             <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="details">تفاصيل المعاملة</Label>
                                <Input id="details" placeholder="أدخل التفاصيل" value={formState.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
                            </div>
                              <div className="space-y-2">
                                <Label htmlFor="type">نوع المعاملة</Label>
                                <Select value={formState.type} onValueChange={(val: 'revenue' | 'expense') => handleInputChange('type', val)}>
                                    <SelectTrigger id="type"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="revenue">إيراد</SelectItem>
                                        <SelectItem value="expense">مصروف</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="classification">تصنيف المعاملة</Label>
                                <Select value={formState.classification} onValueChange={(val) => handleInputChange('classification', val)}>
                                    <SelectTrigger id="classification"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sales">مبيعات</SelectItem>
                                        <SelectItem value="purchases">مشتريات</SelectItem>
                                        <SelectItem value="debt_payment">سداد دين</SelectItem>
                                        <SelectItem value="expense">مصروفات عامة</SelectItem>
                                        <SelectItem value="salary">رواتب</SelectItem>
                                        <SelectItem value="other">أخرى</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency-classification">عملة المعاملة</Label>
                                <Select value={formState.currency} onValueChange={(val) => handleInputChange('currency', val)}>
                                    <SelectTrigger id="currency-classification"><SelectValue placeholder="اختر العملة" /></SelectTrigger>
                                    <SelectContent>
                                       {currencies.map(c => <SelectItem key={c.id} value={c.symbol}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="flex justify-end gap-2 mt-4">
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>{selectedRow ? 'تعديل حركة' : 'إضافة حركة'}</Button>
                             <Button className="bg-primary hover:bg-primary/90" onClick={() => openModal('banks')}><Landmark className="ml-2 h-4 w-4"/> الشبكات المصرفية</Button>
                             <Button className="bg-primary hover:bg-primary/90" onClick={() => openModal('currencies')}>العملات</Button>
                             <Button className="bg-primary hover:bg-primary/90" onClick={() => openModal('branches')}>الافرع</Button>
                             <Button variant="secondary" onClick={onClose}>رجوع</Button>
                        </div>
                    </Card>
                </div>
                
                {/* Actions and Summary */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                     <Card className="p-4 flex flex-col justify-between h-full">
                         <div className="flex flex-col gap-2">
                            <Button variant="outline" onClick={fetchAllData}><RefreshCw className="ml-2"/>تحديث الحركات</Button>
                            <Button variant="outline" disabled={isLoading} onClick={handleGenerateReport}>
                               {isLoading ? <Loader2 className="animate-spin" /> : <Download className="ml-2"/>}
                               التقرير الشامل
                            </Button>
                         </div>
                    </Card>
                    <Card className="p-4 flex flex-col justify-between h-full">
                         <div className="mt-4 p-4 rounded-lg border flex justify-between items-center">
                            <div className="flex gap-2">
                                <Button variant="destructive" onClick={handleDeleteClick} disabled={!selectedRow}>حذف حركة</Button>
                                <Button variant="destructive" onClick={handleClearClick} >تفريغ كل الحركات</Button>
                            </div>
                        </div>
                        <div className="mt-4 text-center space-y-2">
                           {Object.entries(totalsByCurrency).map(([currency, totals]) => (
                                <div key={currency} className="border p-2 rounded-lg">
                                    <h4 className="font-bold text-lg">{currency}</h4>
                                    <p className="text-base">الإيرادات: <span className="font-bold text-green-500">{totals.revenue.toLocaleString('ar-SA')}</span></p>
                                    <p className="text-base">المصروفات: <span className="font-bold text-red-500">{totals.expenses.toLocaleString('ar-SA')}</span></p>
                                    <hr className="my-1" />
                                    <p className="text-lg">الصافي: <span className="font-bold">{(totals.revenue - totals.expenses).toLocaleString('ar-SA')}</span></p>
                                </div>
                           ))}
                           {Object.keys(totalsByCurrency).length === 0 && (
                                <p className="text-muted-foreground">لا توجد حركات مالية لعرض ملخصها.</p>
                           )}
                        </div>
                    </Card>
                </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alertAction === 'delete' ? 'تأكيد الحذف النهائي' : 'تأكيد التفريغ'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {alertAction === 'delete' 
             ? 'هل أنت متأكد أنك تريد حذف هذه المعاملة بشكل نهائي؟'
             : 'هل أنت متأكد أنك تريد تفريغ كل الحركات؟'
            } لا يمكن التراجع عن هذا الإجراء.
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
