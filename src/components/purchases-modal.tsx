'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, FileDown, UserCog, ListFilter, Users, Printer, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { generatePurchasesHtmlReport } from '@/app/export/actions';
import { PurchaseInvoice } from './purchase-invoice';
import { useAuth } from '@/hooks/use-auth';
import { SupplierManagementModal } from './supplier-management-modal';


interface PurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type Supplier = { id: string; name: string; phone_number: string; address: string; contact_person: string; };
export type PurchaseItem = { name: string; quantity: number; price: number; total: number; };
export type Purchase = { id: number; invoiceId: string; supplierId: string; supplier: string; date: Date; items: PurchaseItem[]; totalAmount: number; currency: string; notes?: string; };
type FormState = Partial<Omit<Purchase, 'id' | 'date'>> & { date?: Date };

export function PurchasesModal({ isOpen, onClose }: PurchasesModalProps) {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [formState, setFormState] = useState<FormState>({ date: new Date(), items: [], totalAmount: 0, currency: 'ر.ي' });
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [logo, setLogo] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [purRes, supRes] = await Promise.all([fetch('/api/purchases'), fetch('/api/suppliers')]);
        if (!purRes.ok || !supRes.ok) throw new Error('Failed to fetch data');
        const purData = await purRes.json();
        const supData = await supRes.json();
        setPurchases(purData.map((p: any) => ({...p, date: new Date(p.date), totalAmount: parseFloat(p.totalAmount)})));
        setSuppliers(supData);
    } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات المشتريات.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

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
                console.error("Failed to fetch logo", error);
            }
        };
        fetchLogo();
    }
  }, [isOpen, fetchData]);


  useEffect(() => {
    if (selectedPurchase) {
      setFormState({
          ...selectedPurchase,
          date: new Date(selectedPurchase.date),
      });
    } else {
      resetForm();
    }
  }, [selectedPurchase]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
        const date = new Date(p.date);
        const dateMatch = !dateRange?.from || (date >= startOfDay(dateRange.from) && date <= endOfDay(dateRange.to || dateRange.from));
        const supplierMatch = supplierFilter === 'all' || p.supplierId === supplierFilter;
        const currencyMatch = currencyFilter === 'all' || p.currency === currencyFilter;
        return dateMatch && supplierMatch && currencyMatch;
    });
  }, [purchases, dateRange, supplierFilter, currencyFilter]);
  
  const totalFilteredPurchases = useMemo(() => {
      return filteredPurchases.reduce((acc, curr) => {
          if(!acc[curr.currency]) acc[curr.currency] = 0;
          acc[curr.currency] += curr.totalAmount;
          return acc;
      }, {} as Record<string, number>);
  }, [filteredPurchases]);

  const resetForm = () => {
    setFormState({ invoiceId: '', date: new Date(), items: [], totalAmount: 0, currency: 'ر.ي' });
    setSelectedPurchase(null);
  };

  const handleItemChange = (index: number, field: keyof Omit<PurchaseItem, 'total'>, value: string | number) => {
    const newItems = [...formState.items!];
    const item = { ...newItems[index] };
    
    if (field === 'name') {
      item.name = value as string;
    } else {
      (item[field as 'quantity' | 'price'] as number) = Number(value) < 0 ? 0 : Number(value);
    }
    
    item.total = item.quantity * item.price;
    newItems[index] = item;
    const totalAmount = newItems.reduce((acc, curr) => acc + curr.total, 0);
    setFormState(prev => ({...prev, items: newItems, totalAmount }));
  };

  const addNewItem = () => {
      setFormState(prev => ({...prev, items: [...(prev.items || []), { name: '', quantity: 1, price: 0, total: 0 }]}));
  }

  const removeItem = (index: number) => {
      const newItems = formState.items!.filter((_, i) => i !== index);
      const totalAmount = newItems.reduce((acc, curr) => acc + curr.total, 0);
      setFormState(prev => ({...prev, items: newItems, totalAmount}));
  }

  const handleSave = async () => {
    if (!formState.supplierId || !formState.items || formState.items.length === 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى اختيار مورد وإضافة صنف واحد على الأقل.' });
      return;
    }

    const isEditing = !!selectedPurchase;
    const url = isEditing ? `/api/purchases/${selectedPurchase.id}` : '/api/purchases';
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
        supplierId: formState.supplierId,
        invoice_number: formState.invoiceId,
        purchase_date: formState.date,
        items: formState.items.map(i => ({name: i.name, quantity: i.quantity, price: i.price})),
        totalAmount: formState.totalAmount,
        currency: formState.currency,
        notes: formState.notes,
        userId: user?.id,
    };
    
    setIsLoading(true);
    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save purchase');
        }
        toast({ title: 'تم الحفظ بنجاح!', description: `تم ${isEditing ? 'تعديل' : 'إضافة'} فاتورة الشراء.` });
        resetForm();
        await fetchData();
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'فشل الحفظ', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedPurchase) {
      setIsLoading(true);
      try {
          const response = await fetch(`/api/purchases/${selectedPurchase.id}`, { method: 'DELETE' });
          if(!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to delete purchase');
          }
          toast({title: 'تم الحذف'});
          resetForm();
          await fetchData();
      } catch(e: any) {
          toast({variant: 'destructive', title: 'خطأ في الحذف', description: e.message});
      } finally {
          setIsAlertOpen(false);
          setIsLoading(false);
      }
    }
  };
  
  const handlePrint = () => {
    if (!selectedPurchase) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد فاتورة لطباعتها.' });
      return;
    }
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const printContent = printRef.current?.innerHTML;
        if (printContent) {
            printWindow.document.write('<html><head><title>فاتورة شراء</title>');
            printWindow.document.write('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">');
            printWindow.document.write('<style>@page { size: 80mm auto; margin: 0; } body { font-family: "Almarai", sans-serif; direction: rtl; } .break-after-page { page-break-after: always; }</style>');
            printWindow.document.write('</head><body>' + printContent + '</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    }
  };
  
  const handleExport = async () => {
    toast({ title: 'جاري التصدير...', description: 'سيتم إنشاء تقرير مشتريات HTML.' });
    try {
        const reportHtml = await generatePurchasesHtmlReport({
            purchases: filteredPurchases,
            suppliers
        });
        const blob = new Blob([reportHtml], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'purchases-report.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل تقرير المشتريات.' });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'فشل التصدير', description: 'حدث خطأ أثناء إنشاء التقرير.' });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl">
          {isLoading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          <DialogHeader className="p-4 bg-primary text-primary-foreground">
            <DialogTitle className="text-2xl">إدارة المشتريات</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            {/* Left Panel: Form */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>{selectedPurchase ? `تعديل الفاتورة #${selectedPurchase.id}` : 'فاتورة شراء جديدة'}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <Label>تاريخ الفاتورة</Label>
                        <Popover>
                            <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-right font-normal", !formState.date && "text-muted-foreground")}><CalendarIcon className="ml-2 h-4 w-4" />{formState.date ? format(formState.date, "PPP") : <span>اختر تاريخ</span>}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formState.date} onSelect={(d) => setFormState(p=>({...p, date:d}))} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-1">
                        <Label>المورد</Label>
                        <Select value={formState.supplierId} onValueChange={(val) => setFormState(p => ({...p, supplierId: val}))}>
                            <SelectTrigger><SelectValue placeholder="اختر مورد" /></SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>العملة</Label>
                        <Select value={formState.currency} onValueChange={(val) => setFormState(p => ({...p, currency: val}))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ر.ي">ريال يمني</SelectItem>
                                <SelectItem value="ر.س">ريال سعودي</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>رقم الفاتورة (اختياري)</Label>
                    <Input value={formState.invoiceId || ''} onChange={e => setFormState(p => ({...p, invoiceId: e.target.value}))} />
                  </div>
                   <div className="space-y-1">
                    <Label>ملاحظات (اختياري)</Label>
                    <Input value={formState.notes || ''} onChange={e => setFormState(p => ({...p, notes: e.target.value}))} />
                  </div>
                </div>

                <div className="space-y-2 flex-1 flex flex-col">
                    <Label>الأصناف</Label>
                    <ScrollArea className="h-48 border rounded-md">
                        <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-muted/50 bg-primary/10">
                                <TableHead className="text-primary text-center">الصنف</TableHead>
                                <TableHead className="text-primary text-center">الكمية</TableHead>
                                <TableHead className="text-primary text-center">السعر</TableHead>
                                <TableHead className="text-primary text-center">الإجمالي</TableHead>
                                <TableHead className="text-primary"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                                {formState.items?.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Input placeholder="اكتب اسم الصنف..." value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                                        </TableCell>
                                        <TableCell><Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20 text-center"/></TableCell>
                                        <TableCell><Input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} className="w-24 text-center"/></TableCell>
                                        <TableCell className="text-center font-semibold">{item.total.toFixed(2)} {formState.currency}</TableCell>
                                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <Button onClick={addNewItem} variant="outline" className="w-full mt-2"><Plus className="ml-2"/> إضافة صنف</Button>
                </div>
                <div className="border-t pt-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                      <span>الإجمالي العام</span>
                      <span>{formState.totalAmount?.toLocaleString('ar-SA')} {formState.currency}</span>
                  </div>
                  <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1 bg-green-500 hover:bg-green-600 text-white">{selectedPurchase ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</Button>
                      <Button onClick={resetForm} variant="ghost">فاتورة جديدة</Button>
                      {selectedPurchase && <Button variant="destructive" onClick={() => setIsAlertOpen(true)}>حذف</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel: List */}
            <Card className="flex flex-col">
                  <CardHeader>
                      <div className="flex justify-between items-center">
                          <CardTitle>سجل المشتريات</CardTitle>
                          <div className="flex gap-2">
                              <Button variant="outline" onClick={handlePrint} disabled={!selectedPurchase}><Printer className="ml-2"/> طباعة</Button>
                              <Button variant="outline" onClick={handleExport}><FileDown className="ml-2" /> تصدير</Button>
                          </div>
                      </div>
                       <div className="flex items-center gap-2 pt-4">
                          <ListFilter className="h-5 w-5 text-muted-foreground"/>
                          <Popover>
                              <PopoverTrigger asChild><Button id="date" variant={"outline"} className={cn("w-[250px] justify-start text-right font-normal", !dateRange && "text-muted-foreground")}><CalendarIcon className="ml-2 h-4 w-4" />{dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>نطاق التاريخ</span>)}</Button></PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
                          </Popover>
                          <Select value={supplierFilter} onValueChange={setSupplierFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="كل الموردين"/></SelectTrigger><SelectContent><SelectItem value="all">كل الموردين</SelectItem>{suppliers.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                          <Select value={currencyFilter} onValueChange={setCurrencyFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="كل العملات"/></SelectTrigger><SelectContent><SelectItem value="all">كل العملات</SelectItem><SelectItem value="ر.ي">ريال يمني</SelectItem><SelectItem value="ر.س">ريال سعودي</SelectItem></SelectContent></Select>
                       </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                      <ScrollArea className="h-[400px]">
                          <Table>
                              <TableHeader>
                                <TableRow className="hover:bg-muted/50 bg-primary/10">
                                  <TableHead className="text-primary text-center">رقم الفاتورة</TableHead>
                                  <TableHead className="text-primary text-center">المورد</TableHead>
                                  <TableHead className="text-primary text-center">التاريخ</TableHead>
                                  <TableHead className="text-primary text-center">الإجمالي</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                              {filteredPurchases.map((p) => (
                                  <TableRow key={p.id} onClick={() => setSelectedPurchase(p)} className={cn('cursor-pointer', selectedPurchase?.id === p.id && 'bg-primary/20')}>
                                  <TableCell className="text-center">{p.invoiceId || p.id}</TableCell>
                                  <TableCell className="text-center">{p.supplier}</TableCell>
                                  <TableCell className="text-center">{format(p.date, "yyyy/MM/dd")}</TableCell>
                                  <TableCell className="text-center">{p.totalAmount.toLocaleString('ar-SA')} {p.currency}</TableCell>
                                  </TableRow>
                              ))}
                              </TableBody>
                          </Table>
                      </ScrollArea>
                  </CardContent>
                  <DialogFooter className="p-2 border-t mt-auto">
                      <div className="flex justify-end w-full font-semibold">
                          الإجمالي: 
                          {Object.entries(totalFilteredPurchases).map(([currency, total]) => (
                              <span key={currency} className="mx-2">{total.toLocaleString('ar-SA')} {currency}</span>
                          ))}
                      </div>
                  </DialogFooter>
              </Card>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد أنك تريد حذف فاتورة الشراء رقم {selectedPurchase?.id}؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
       <div className="hidden">
        {selectedPurchase && <PurchaseInvoice ref={printRef} purchase={selectedPurchase} logo={logo} />}
      </div>
    </>
  );
}
