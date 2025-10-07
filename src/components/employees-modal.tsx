'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Trash2, Printer, HandCoins, Award, CheckCircle, FileDown, Loader2, Save, UserPlus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, getYear, getMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeRecord } from './employee-record';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { generateEmployeesReportHtml } from '@/app/export/actions';
import { useAuth } from '@/hooks/use-auth';

interface EmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type Employee = { id: string; name: string; jobTitle: string; nationalId: string; salary: number; currency: string; hireDate: Date; notes: string; };
export type Absence = { id: number; employeeId: string; date: Date; reason: string; deduction: number; currency: string; };
export type SalaryPayment = { id: number; employeeId: string; date: Date; amount: number; currency: string; notes: string; };
export type Bonus = { id: number; employeeId: string; date: Date; amount: number; currency: string; notes: string; };

type EmployeeFormState = Partial<Omit<Employee, 'id'|'hireDate'> & { hireDate?: Date }>;
type AbsenceFormState = Partial<Omit<Absence, 'id'|'employeeId'|'date'> & { date?: Date }>;
type SalaryPaymentFormState = Partial<Omit<SalaryPayment, 'id'|'employeeId'|'date'> & { date?: Date }>;
type BonusFormState = Partial<Omit<Bonus, 'id'|'employeeId'|'date'> & { date?: Date }>;

type ActionType = 'deleteEmployee' | 'deleteAbsence' | 'deleteAdvance' | 'deleteBonus' | 'paySalary' | 'clearAbsences' | null;

export function EmployeesModal({ isOpen, onClose }: EmployeesModalProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>({});
  const [absenceForm, setAbsenceForm] = useState<AbsenceFormState>({currency: 'ر.ي'});
  const [advanceForm, setAdvanceForm] = useState<SalaryPaymentFormState>({currency: 'ر.ي'});
  const [bonusForm, setBonusForm] = useState<BonusFormState>({currency: 'ر.ي'});
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<ActionType>(null);
  const [itemToProcess, setItemToProcess] = useState<Employee | Absence | SalaryPayment | Bonus | null>(null);

  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [empRes, absRes, advRes, bonRes] = await Promise.all([
            fetch('/api/employees'),
            fetch('/api/employees/absences'),
            fetch('/api/employees/advances'),
            fetch('/api/employees/bonuses')
        ]);
        if (!empRes.ok || !absRes.ok || !advRes.ok || !bonRes.ok) throw new Error('Failed to fetch initial data');
        const [empData, absData, advData, bonData] = await Promise.all([empRes.json(), absRes.json(), advRes.json(), bonRes.json()]);

        const typedEmployees: Employee[] = empData.map((e: any) => ({ ...e, salary: parseFloat(e.salary), hireDate: new Date(e.hireDate) }));
        setEmployees(typedEmployees);
        setAbsences(absData.map((a: any) => ({...a, date: new Date(a.date), deduction: parseFloat(a.deduction)})));
        setSalaryPayments(advData.map((a: any) => ({...a, date: new Date(a.date), amount: parseFloat(a.amount)})));
        setBonuses(bonData.map((b: any) => ({...b, date: new Date(b.date), amount: parseFloat(b.amount)})));

        if (typedEmployees.length > 0 && !selectedEmployee) {
            setSelectedEmployee(typedEmployees[0]);
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'فشل في جلب البيانات', description: 'لم نتمكن من تحميل بيانات الموظفين.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast, selectedEmployee]);

  useEffect(() => {
    if (isOpen) {
        fetchData();
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
  }, [isOpen, fetchData]);


  const prepareNewEmployeeForm = () => {
    setSelectedEmployee(null);
    setEmployeeForm({ hireDate: new Date(), salary: 0, currency: 'ر.ي', name: '', jobTitle: '', nationalId: '', notes: ''});
    setAbsenceForm({ date: new Date(), reason: '', deduction: 0, currency: 'ر.ي' });
    setAdvanceForm({ date: new Date(), amount: 0, notes: '', currency: 'ر.ي' });
    setBonusForm({ date: new Date(), amount: 0, notes: '', currency: 'ر.ي' });
  };
  
  useEffect(() => {
    if (selectedEmployee) {
      setEmployeeForm({ ...selectedEmployee, hireDate: new Date(selectedEmployee.hireDate) });
      setAbsenceForm({ date: new Date(), currency: selectedEmployee.currency });
      setAdvanceForm({ date: new Date(), amount: 0, notes: '', currency: selectedEmployee.currency });
      setBonusForm({ date: new Date(), amount: 0, notes: '', currency: selectedEmployee.currency });
    } else {
      prepareNewEmployeeForm();
    }
  }, [selectedEmployee]);

  
  const handleEmployeeInputChange = (field: keyof EmployeeFormState, value: any) => {
    setEmployeeForm(prev => ({...prev, [field]: value}));
  };

  const handleAbsenceInputChange = (field: keyof AbsenceFormState, value: any) => {
    setAbsenceForm(prev => ({...prev, [field]: value}));
  };
  
  const handleAdvanceInputChange = (field: keyof SalaryPaymentFormState, value: any) => {
    setAdvanceForm(prev => ({...prev, [field]: value}));
  };
  
  const handleBonusInputChange = (field: keyof BonusFormState, value: any) => {
    setBonusForm(prev => ({...prev, [field]: value}));
  };

  const handleSaveEmployee = async () => {
    if (!employeeForm.name || !employeeForm.jobTitle) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء اسم الموظف والمسمى الوظيفي.' });
      return;
    }
    const isNew = !selectedEmployee;
    const url = isNew ? '/api/employees' : `/api/employees/${selectedEmployee.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    // Prepare only the data needed for the API
    const payload = {
        name: employeeForm.name,
        jobTitle: employeeForm.jobTitle,
        nationalId: employeeForm.nationalId,
        salary: employeeForm.salary,
        currency: employeeForm.currency,
        hireDate: employeeForm.hireDate,
        notes: employeeForm.notes,
    };

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save employee');
        }
        const savedEmployee = await response.json();
        const finalEmployee = { ...savedEmployee, salary: parseFloat(savedEmployee.salary), hireDate: new Date(savedEmployee.hireDate) }
        
        if (isNew) {
            setEmployees(prev => [finalEmployee, ...prev]);
        } else {
            setEmployees(prev => prev.map(e => e.id === finalEmployee.id ? finalEmployee : e));
        }
        toast({ title: 'تم بنجاح', description: `تم ${isNew ? 'إضافة' : 'تعديل'} بيانات الموظف.`});
        setSelectedEmployee(finalEmployee);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message || 'فشل حفظ بيانات الموظف.' });
    }
  };
  
  const openConfirmationDialog = (action: ActionType, item: Employee | Absence | SalaryPayment | Bonus | null) => {
    if (!selectedEmployee && (action === 'paySalary' || action === 'clearAbsences' || action === 'deleteEmployee')) {
      toast({ variant: 'destructive', title: "خطأ", description: "يرجى تحديد موظف أولاً."});
      return;
    }
    setActionToConfirm(action);
    setItemToProcess(item);
    setIsAlertOpen(true);
  };

  const handleSaveSubRecord = async (type: 'absence' | 'advance' | 'bonus') => {
      let url, body, successMessage, formToReset;
      
      if (!selectedEmployee) {
          toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد موظف أولاً.' });
          return;
      }

      switch(type) {
        case 'absence':
            if (!absenceForm.reason) { toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال سبب الغياب.' }); return; }
            url = '/api/employees/absences';
            body = { ...absenceForm, employeeId: selectedEmployee.id };
            successMessage = "تم تسجيل الغياب بنجاح.";
            formToReset = () => setAbsenceForm({date: new Date(), reason: '', deduction: 0, currency: selectedEmployee.currency});
            break;
        case 'advance':
            if (!advanceForm.amount) { toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال مبلغ السلفة.' }); return; }
            url = '/api/employees/advances';
            body = { ...advanceForm, employeeId: selectedEmployee.id };
            successMessage = "تم تسجيل السلفة بنجاح.";
            formToReset = () => setAdvanceForm({date: new Date(), amount: 0, notes: '', currency: selectedEmployee.currency});
            break;
        case 'bonus':
            if (!bonusForm.amount) { toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال مبلغ العلاوة.' }); return; }
            url = '/api/employees/bonuses';
            body = { ...bonusForm, employeeId: selectedEmployee.id };
            successMessage = "تم تسجيل العلاوة بنجاح.";
            formToReset = () => setBonusForm({date: new Date(), amount: 0, notes: '', currency: selectedEmployee.currency});
            break;
      }

      try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(`Failed to save ${type}`);
        const savedRecord = await response.json();

        switch(type) {
            case 'absence': setAbsences(prev => [...prev, {...savedRecord, date: new Date(savedRecord.date), deduction: parseFloat(savedRecord.deduction)}]); break;
            case 'advance': setSalaryPayments(prev => [...prev, {...savedRecord, date: new Date(savedRecord.date), amount: parseFloat(savedRecord.amount)}]); break;
            case 'bonus': setBonuses(prev => [...prev, {...savedRecord, date: new Date(savedRecord.date), amount: parseFloat(savedRecord.amount)}]); break;
        }

        formToReset();
        toast({title: "تمت الإضافة", description: successMessage});

      } catch (error) {
          toast({ variant: 'destructive', title: 'خطأ', description: `فشل تسجيل ${type}.` });
      }
  };

  const handleConfirmAction = async () => {
    if (!actionToConfirm) return;
    
    let url, method = 'DELETE', body;

    try {
        switch(actionToConfirm) {
        case 'deleteEmployee':
            if (itemToProcess) {
                await fetch(`/api/employees/${(itemToProcess as Employee).id}`, { method: 'DELETE' });
                setEmployees(prev => prev.filter(e => e.id !== itemToProcess!.id));
                prepareNewEmployeeForm();
                toast({ title: 'تم الحذف', description: `تم حذف الموظف ${(itemToProcess as Employee).name}`});
            }
            break;
        case 'deleteAbsence':
        case 'deleteAdvance':
        case 'deleteBonus':
            if (itemToProcess) {
                const type = actionToConfirm.replace('delete', '').toLowerCase();
                await fetch(`/api/employees/${type}s/${(itemToProcess as any).id}`, { method: 'DELETE' });
                if(type === 'absence') setAbsences(prev => prev.filter(a => a.id !== (itemToProcess as Absence).id));
                if(type === 'advance') setSalaryPayments(prev => prev.filter(a => a.id !== (itemToProcess as SalaryPayment).id));
                if(type === 'bonus') setBonuses(prev => prev.filter(a => a.id !== (itemToProcess as Bonus).id));
                toast({ title: 'تم الحذف', description: `تم حذف السجل`});
            }
            break;
        case 'paySalary':
            if(selectedEmployee && netSalary > 0) {
              const salaryDescription = `صرف راتب شهر ${format(selectedMonth, 'MMMM yyyy', {locale: ar})} للموظف ${selectedEmployee.name}`;
              
              // 1. Record the salary payment as an expense in transactions
              const expensePayload = {
                  user_id: user?.id,
                  type: 'expense',
                  classification: 'salary',
                  amount: netSalary,
                  currency: selectedEmployee.currency,
                  description: salaryDescription,
                  related_id: selectedEmployee.id,
                  transaction_date: new Date(),
              };
              const expenseRes = await fetch('/api/transactions', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(expensePayload)
              });
              if (!expenseRes.ok) throw new Error('فشل تسجيل الراتب كمصروف.');
              
              // 2. Record the payment in the employee's advances/payments log
              const finalPayment = {
                  employeeId: selectedEmployee.id,
                  date: new Date(),
                  amount: netSalary,
                  currency: selectedEmployee.currency,
                  notes: `صرف راتب شهر ${format(selectedMonth, 'MMMM yyyy', { locale: ar })}`,
              };
              const res = await fetch('/api/employees/advances', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(finalPayment)});
              const savedPayment = await res.json();
              setSalaryPayments(prev => [...prev, {...savedPayment, date: new Date(savedPayment.date), amount: parseFloat(savedPayment.amount) }]);

              toast({ title: "تم صرف الراتب", description: "تم تسجيل العملية في الصندوق المحاسبي." });

            } else {
                toast({variant: 'destructive', title: "خطأ", description: "لا يوجد مبلغ مستحق ليتم صرفه."});
            }
            break;
        case 'clearAbsences':
            // This is a more complex operation, would typically be a specific API endpoint.
            // For now, we simulate it on the client.
            if(selectedEmployee) {
                setAbsences(prev => prev.filter(a => a.employeeId !== selectedEmployee.id));
                toast({ title: 'تم التبييض', description: `تم مسح جميع سجلات الغياب للموظف ${selectedEmployee.name}.`});
            }
            break;
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message || `فشل تنفيذ الإجراء.`});
    }

    setIsAlertOpen(false);
    setActionToConfirm(null);
    setItemToProcess(null);
  };
  
  const getAlertDialogContent = () => {
    switch (actionToConfirm) {
      case 'deleteEmployee':
        return { title: 'تأكيد حذف الموظف', description: 'هل أنت متأكد أنك تريد حذف هذا الموظف؟' };
      case 'deleteAbsence':
        return { title: 'تأكيد حذف الغياب', description: 'هل أنت متأكد أنك تريد حذف سجل الغياب هذا؟' };
      case 'deleteAdvance':
        return { title: 'تأكيد حذف السلفة', description: 'هل أنت متأكد أنك تريد حذف سجل السلفة هذا؟' };
      case 'deleteBonus':
        return { title: 'تأكيد حذف العلاوة', description: 'هل أنت متأكد أنك تريد حذف سجل العلاوة هذا؟' };
      case 'paySalary':
        return { title: 'تأكيد صرف الراتب', description: `هل أنت متأكد أنك تريد صرف صافي راتب الموظف ${selectedEmployee?.name} بمبلغ ${netSalary.toLocaleString('ar-SA')} ${selectedEmployee?.currency}؟` };
      case 'clearAbsences':
        return { title: 'تأكيد تبييض الغياب', description: `هل أنت متأكد أنك تريد مسح جميع سجلات الغياب للموظف ${selectedEmployee?.name}؟` };
      default:
        return { title: 'تأكيد الإجراء', description: 'هل أنت متأكد أنك تريد المتابعة؟' };
    }
  };

  const filteredData = useMemo(() => {
    if (!selectedEmployee) return { absences: [], payments: [], bonuses: [] };
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const monthlyAbsences = absences.filter(a =>
        a.employeeId === selectedEmployee.id &&
        new Date(a.date) >= monthStart &&
        new Date(a.date) <= monthEnd
    );
    const monthlyPayments = salaryPayments.filter(p =>
        p.employeeId === selectedEmployee.id &&
        new Date(p.date) >= monthStart &&
        new Date(p.date) <= monthEnd
    );
     const monthlyBonuses = bonuses.filter(b =>
        b.employeeId === selectedEmployee.id &&
        new Date(b.date) >= monthStart &&
        new Date(b.date) <= monthEnd
    );
    return { absences: monthlyAbsences, payments: monthlyPayments, bonuses: monthlyBonuses };
  }, [absences, salaryPayments, bonuses, selectedEmployee, selectedMonth]);
  
  const totalDeductions = useMemo(() => filteredData.absences.reduce((sum, a) => sum + (a.deduction || 0), 0), [filteredData.absences]);
  const totalAdvances = useMemo(() => filteredData.payments.reduce((sum, p) => sum + (p.amount || 0), 0), [filteredData.payments]);
  const totalBonuses = useMemo(() => filteredData.bonuses.reduce((sum, p) => sum + (p.amount || 0), 0), [filteredData.bonuses]);
  const netSalary = useMemo(() => (selectedEmployee?.salary || 0) + totalBonuses - totalDeductions - totalAdvances, [selectedEmployee, totalBonuses, totalDeductions, totalAdvances]);
  
  const isSalaryPaidForMonth = useMemo(() => {
    if (!selectedEmployee) return false;
    const salaryPaymentNote = `صرف راتب شهر ${format(selectedMonth, 'MMMM yyyy', { locale: ar })}`;
    return filteredData.payments.some(p => p.notes === salaryPaymentNote);
  }, [filteredData.payments, selectedMonth, selectedEmployee]);
  
 const handlePrint = () => {
    if (!selectedEmployee) {
        toast({variant: 'destructive', title: "خطأ", description: "يرجى تحديد موظف لطباعة سجله."});
        return;
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const printContent = printRef.current?.innerHTML;
        const styles = `
            <style>
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                body { font-family: 'Cairo', 'Almarai', sans-serif; direction: rtl; margin: 0; background-color: #fff; color: #000; }
                @page { size: 80mm auto; margin: 0mm; }
                .receipt-container { width: 80mm; padding: 10px; box-sizing: border-box; }
                .header, .final-total { text-align: center; }
                .logo-container { text-align: center; margin-bottom: 10px; }
                .logo { max-height: 60px; max-width: 100%; }
                .header h2 { margin: 0 0 5px 0; font-size: 16px; }
                .header p, .details p, .section p { margin: 2px 0; font-size: 12px; }
                .details { margin: 10px 0; }
                hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
                hr.bold-hr { border-top: 2px solid #000; }
                .section h4 { font-size: 13px; margin: 10px 0 5px 0; text-align: center; background: #eee; padding: 2px;}
                .item { display: flex; justify-content: space-between; font-size: 11px; }
                .no-data { font-size: 11px; text-align: center; color: #777; }
                .total-line { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-top: 5px; border-top: 1px solid #ccc; padding-top: 3px; }
                .final-total h3 { margin: 5px 0; }
                .signatures { margin-top: 30px; font-size: 12px; }
                .signature-line { margin-top: 20px; border-top: 1px solid #555; padding-top: 5px; text-align: center; }
            </style>
             <link rel="preconnect" href="https://fonts.googleapis.com">
             <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
             <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Cairo:wght@400;700&display=swap" rel="stylesheet">
        `;
        if (printContent) {
            printWindow.document.write('<html><head><title>سجل الموظف</title>' + styles + '</head><body>' + printContent + '</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    }
  };

  const handleExport = async () => {
    toast({ title: 'جاري إنشاء التقرير...', description: 'يتم تجهيز تقرير HTML بالموظفين الحاليين.' });
    
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const detailedEmployees = employees.map(emp => {
      const empAbsences = absences.filter(a => a.employeeId === emp.id && new Date(a.date) >= monthStart && new Date(a.date) <= monthEnd);
      const empBonuses = bonuses.filter(b => b.employeeId === emp.id && new Date(b.date) >= monthStart && new Date(b.date) <= monthEnd);
      const empAdvances = salaryPayments.filter(p => p.employeeId === emp.id && new Date(p.date) >= monthStart && new Date(p.date) <= monthEnd);
      return { ...emp, hireDate: new Date(emp.hireDate), absences: empAbsences, bonuses: empBonuses, advances: empAdvances };
    });

    try {
      const reportHtml = await generateEmployeesReportHtml(detailedEmployees);
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-report-${format(selectedMonth, 'yyyy-MM')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل تقرير الموظفين.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
    }
  }


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-4">
          <DialogHeader className="bg-primary text-primary-foreground p-4 -m-4 mb-2">
            <DialogTitle className="text-2xl">الموظفين</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 grid md:grid-cols-3 gap-4 overflow-hidden">
            {/* Left Panel: Employee Form */}
            <ScrollArea className="md:col-span-1">
                <div className="bg-card p-4 rounded-lg border h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-4">{selectedEmployee ? 'بيانات الموظف' : 'إضافة موظف جديد'}</h3>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="hire-date">تاريخ التوظيف</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-right font-normal", !employeeForm.hireDate && "text-muted-foreground")}>
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {employeeForm.hireDate ? format(new Date(employeeForm.hireDate), "PPP") : <span>اختر تاريخ</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={employeeForm.hireDate ? new Date(employeeForm.hireDate) : undefined} onSelect={(d) => handleEmployeeInputChange('hireDate', d)} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="employee-name">اسم الموظف</Label>
                            <Input id="employee-name" value={employeeForm.name || ''} onChange={e => handleEmployeeInputChange('name', e.target.value)}/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="job-title">الوظيفة</Label>
                            <Input id="job-title" value={employeeForm.jobTitle || ''} onChange={e => handleEmployeeInputChange('jobTitle', e.target.value)}/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="national-id">رقم الجوال</Label>
                            <Input id="national-id" value={employeeForm.nationalId || ''} onChange={e => handleEmployeeInputChange('nationalId', e.target.value)}/>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            <div className="col-span-3 space-y-1">
                                <Label htmlFor="salary">الراتب</Label>
                                <Input id="salary" type="number" value={employeeForm.salary || ''} onChange={e => handleEmployeeInputChange('salary', Number(e.target.value))}/>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <Label htmlFor="currency">العملة</Label>
                                <Select value={employeeForm.currency} onValueChange={v => handleEmployeeInputChange('currency', v)}>
                                    <SelectTrigger id="currency"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ر.ي">ريال يمني</SelectItem>
                                        <SelectItem value="ر.س">ريال سعودي</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="notes">ملاحظات</Label>
                            <Textarea id="notes" value={employeeForm.notes || ''} onChange={e => handleEmployeeInputChange('notes', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-4 mt-auto">
                        <Button onClick={handleSaveEmployee} className="bg-green-600 hover:bg-green-700">
                            <Save className="ml-2 h-4 w-4" />
                            {selectedEmployee ? 'حفظ التعديلات' : 'إضافة وحفظ الموظف'}
                        </Button>
                        <div className="flex gap-2">
                            <Button onClick={prepareNewEmployeeForm} className="flex-1"><UserPlus className="ml-2 h-4 w-4"/>موظف جديد</Button>
                            {selectedEmployee && (
                            <Button variant="destructive" onClick={() => openConfirmationDialog('deleteEmployee', selectedEmployee)}>
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    حذف
                            </Button>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>
            
            {/* Right Panel: Tables */}
            <div className="md:col-span-2 flex flex-col gap-4 overflow-hidden">
                 {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                <>
                <div className="flex-1 rounded-lg overflow-hidden border bg-card">
                    <div className='flex justify-between items-center p-2 border-b'>
                        <h3 className='font-semibold'>قائمة الموظفين</h3>
                        <Button variant="outline" size="sm" onClick={handleExport}><FileDown className="ml-2 h-4 w-4"/>تصدير HTML</Button>
                    </div>
                    <ScrollArea className="h-full">
                        <Table>
                            <TableHeader><TableRow className="hover:bg-muted/50 bg-primary">
                                <TableHead className="text-primary-foreground text-center">الاسم</TableHead>
                                <TableHead className="text-primary-foreground text-center">الوظيفة</TableHead>
                                <TableHead className="text-primary-foreground text-center">رقم الجوال</TableHead>
                                <TableHead className="text-primary-foreground text-center">الراتب</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                            {employees.map((emp) => (
                                <TableRow key={emp.id} onClick={() => setSelectedEmployee(emp)} className={cn('cursor-pointer', selectedEmployee?.id === emp.id && 'bg-primary/20')}>
                                <TableCell className="text-center">{emp.name}</TableCell>
                                <TableCell className="text-center">{emp.jobTitle}</TableCell>
                                <TableCell className="text-center">{emp.nationalId}</TableCell>
                                <TableCell className="text-center">{emp.salary ? emp.salary.toLocaleString('ar-SA') : '0'} {emp.currency}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
                 <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 flex flex-col gap-4 bg-card p-4 rounded-lg border">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">سجل الرواتب والغياب</h3>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={String(getMonth(selectedMonth))}
                                    onValueChange={(val) => setSelectedMonth(new Date(getYear(selectedMonth), parseInt(val)))}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <SelectItem key={i} value={String(i)}>
                                                {format(new Date(2000, i), 'MMMM', { locale: ar })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={String(getYear(selectedMonth))}
                                    onValueChange={(val) => setSelectedMonth(new Date(parseInt(val), getMonth(selectedMonth)))}
                                >
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const year = getYear(new Date()) - i;
                                            return <SelectItem key={year} value={String(year)}>{year}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
                            {/* Bonuses */}
                            <div className="flex flex-col gap-2">
                                <h4 className="font-semibold">العلاوات</h4>
                                <ScrollArea className="h-40 border rounded bg-background p-2">
                                  {filteredData.bonuses.map(b => (
                                    <div key={b.id} className="text-sm p-1 border-b">
                                      <div className="flex justify-between"><span>{b.notes}</span><span className="font-bold text-green-500">+{b.amount.toLocaleString('ar-SA')} {b.currency}</span></div>
                                       <div className="flex justify-between text-xs text-muted-foreground"><span>{format(new Date(b.date), 'yyyy/MM/dd')}</span><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => openConfirmationDialog('deleteBonus', b)}><Trash2 className="h-3 w-3 text-red-500" /></Button></div>
                                    </div>
                                  ))}
                                </ScrollArea>
                                <div className="flex gap-2">
                                    <Input placeholder="المبلغ" type="number" value={bonusForm.amount || ''} onChange={e => handleBonusInputChange('amount', e.target.value)} />
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleSaveSubRecord('bonus')}><Award size={16}/></Button>
                                </div>
                            </div>
                            {/* Payroll Advances */}
                            <div className="flex flex-col gap-2">
                                <h4 className="font-semibold">السلف والمدفوعات</h4>
                                <ScrollArea className="h-40 border rounded bg-background p-2">
                                  {filteredData.payments.map(p => (
                                    <div key={p.id} className="text-sm p-1 border-b">
                                      <div className="flex justify-between"><span>{p.notes}</span><span className="font-bold text-red-500">-{p.amount.toLocaleString('ar-SA')} {p.currency}</span></div>
                                       <div className="flex justify-between text-xs text-muted-foreground"><span>{format(new Date(p.date), 'yyyy/MM/dd')}</span><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => openConfirmationDialog('deleteAdvance', p)}><Trash2 className="h-3 w-3 text-red-500" /></Button></div>
                                    </div>
                                  ))}
                                </ScrollArea>
                                <div className="flex gap-2">
                                    <Input placeholder="المبلغ" type="number" value={advanceForm.amount || ''} onChange={e => handleAdvanceInputChange('amount', e.target.value)} />
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleSaveSubRecord('advance')}><HandCoins size={16}/></Button>
                                </div>
                            </div>
                            {/* Absence Table */}
                            <div className="flex flex-col gap-2">
                                <h4 className="font-semibold">سجل الغياب</h4>
                                <ScrollArea className="h-40 border rounded bg-background p-2">
                                  {filteredData.absences.map(abs => (
                                    <div key={abs.id} className="text-sm p-1 border-b">
                                      <div className="flex justify-between"><span>{abs.reason}</span><span className="font-bold text-red-500">-{abs.deduction.toLocaleString('ar-SA')} {abs.currency}</span></div>
                                      <div className="flex justify-between text-xs text-muted-foreground"><span>{format(new Date(abs.date), "yyyy/MM/dd")}</span><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => openConfirmationDialog('deleteAbsence', abs)}><Trash2 className="h-3 w-3 text-red-500" /></Button></div>
                                    </div>
                                  ))}
                                </ScrollArea>
                                <div className="flex gap-2">
                                    <Input placeholder="السبب" value={absenceForm.reason || ''} onChange={e => handleAbsenceInputChange('reason', e.target.value)} />
                                    <Input placeholder="الخصم" type="number" value={absenceForm.deduction || ''} onChange={e => handleAbsenceInputChange('deduction', Number(e.target.value))} className="w-24"/>
                                    <Button onClick={() => handleSaveSubRecord('absence')}>إضافة غياب</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Payroll Section */}
                    <div className="md:col-span-1 flex flex-col gap-2 bg-card p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold text-center mb-2">حساب الراتب</h3>
                        <div className="space-y-3 text-sm flex-1">
                            <div className="flex justify-between"><span>الراتب الأساسي:</span> <span className="font-bold">{(selectedEmployee?.salary || 0).toLocaleString('ar-SA')} {selectedEmployee?.currency}</span></div>
                            <div className="flex justify-between text-green-500"><span>إجمالي العلاوات:</span> <span className="font-bold">+{totalBonuses.toLocaleString('ar-SA')} {selectedEmployee?.currency}</span></div>
                            <div className="flex justify-between text-red-500"><span>إجمالي الخصومات:</span> <span className="font-bold">-{totalDeductions.toLocaleString('ar-SA')} {selectedEmployee?.currency}</span></div>
                            <div className="flex justify-between text-yellow-600"><span>إجمالي السلف:</span> <span className="font-bold">-{totalAdvances.toLocaleString('ar-SA')} {selectedEmployee?.currency}</span></div>
                            <hr className="my-2 border-border"/>
                            <div className="flex justify-between font-bold text-lg text-green-600"><span>صافي الراتب المستحق:</span> <span>{netSalary.toLocaleString('ar-SA')} {selectedEmployee?.currency}</span></div>
                        </div>
                        <div className="mt-auto flex flex-col gap-2">
                             {isSalaryPaidForMonth ? (
                                <div className="flex items-center justify-center gap-2 text-green-600 font-semibold p-2 bg-green-100 rounded-md">
                                    <CheckCircle size={20}/>
                                    <span>تم صرف الراتب لهذا الشهر</span>
                                </div>
                             ) : (
                                <Button className="bg-primary hover:bg-primary/90" onClick={() => openConfirmationDialog('paySalary', null)} disabled={isSalaryPaidForMonth}>صرف الراتب</Button>
                             )}
                            <Button onClick={handlePrint}><Printer className="ml-2"/> طباعة سجل الموظف</Button>
                            <Button variant="secondary" onClick={onClose}>رجوع</Button>
                        </div>
                    </div>
                </div>
                </>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        {selectedEmployee && <EmployeeRecord ref={printRef} employee={selectedEmployee} absences={filteredData.absences} payments={filteredData.payments} bonuses={filteredData.bonuses} netSalary={netSalary} logo={logo} />}
      </div>

       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getAlertDialogContent().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getAlertDialogContent().description} لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} className="bg-destructive hover:bg-destructive/90">
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
