'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wallet, Briefcase, BarChart2, Users, ShoppingBag, Trash2, ListX, FileDown, Calendar as CalendarIcon, Landmark, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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
import { cn } from '@/lib/utils';
import { generateHtmlReport } from '@/app/export/actions';
import type { Order } from './orders-log-modal';


export type DailySummary = {
  id: number;
  summary_date: Date;
  net_sales: number;
  total_refunds: number;
  total_orders: number;
  cash_total: number;
  card_total: number;
  network_total: number;
  network_by_bank: Record<string, number>;
  top_selling_items: { name: string; quantity: number }[];
  cashier_performance: { name: string; orderCount: number; totalSales: number }[];
};

interface DailySummaryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailySummaryLogModal({ isOpen, onClose }: DailySummaryLogModalProps) {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertAction, setAlertAction] = useState<'delete' | 'clear' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSummaries = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/daily-summaries');
        if (!response.ok) throw new Error('Failed to fetch summaries');
        const data = await response.json();
        const typedSummaries = data.map((s: any) => ({
            ...s,
            summary_date: new Date(s.summary_date),
            net_sales: parseFloat(s.net_sales),
            cash_total: parseFloat(s.cash_total),
            card_total: parseFloat(s.card_total),
            network_total: parseFloat(s.network_total),
        }));
        setSummaries(typedSummaries);
    } catch(e) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب سجل الملخصات.'});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
        fetchSummaries();
    }
  }, [isOpen, fetchSummaries]);


  const filteredSummaries = useMemo(() => {
    return summaries.filter(summary => {
      if (!dateRange || !dateRange.from) return true;
      const toDate = dateRange.to || dateRange.from;
      const summaryDate = new Date(summary.summary_date);
      summaryDate.setHours(0, 0, 0, 0);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDateEnd = new Date(toDate);
      toDateEnd.setHours(23, 59, 59, 999);
      
      return summaryDate >= fromDate && summaryDate <= toDateEnd;
    });
  }, [summaries, dateRange]);
  
  const handleAction = (action: 'delete' | 'clear') => {
    if (action === 'delete' && !selectedSummary) {
        toast({variant: 'destructive', title: "خطأ", description: "يرجى تحديد صف لحذفه."});
        return;
    }
    setAlertAction(action);
    setIsAlertOpen(true);
  }
  
  const handleConfirmAction = async () => {
    setIsLoading(true);
    try {
        if (alertAction === 'delete' && selectedSummary) {
            const res = await fetch(`/api/daily-summaries?id=${selectedSummary.id}`, {method: 'DELETE'});
            if (!res.ok) throw new Error('Failed to delete summary');
            toast({title: "تم الحذف", description: "تم حذف الملخص اليومي المحدد."});
        } else if (alertAction === 'clear') {
            const res = await fetch('/api/daily-summaries', {method: 'DELETE'});
            if (!res.ok) throw new Error('Failed to clear summaries');
            toast({title: "تم التفريغ", description: "تم مسح جميع سجلات الملخصات اليومية."});
        }
        await fetchSummaries();
        setSelectedSummary(null);
    } catch (e: any) {
        toast({variant: 'destructive', title: 'خطأ', description: e.message});
    } finally {
        setIsAlertOpen(false);
        setIsLoading(false);
    }
  }

  const handleExport = async () => {
      if (!dateRange || !dateRange.from) {
        toast({variant: "destructive", title: "خطأ", description: "يرجى تحديد نطاق تاريخي للتصدير."});
        return;
      }
      toast({title: "جاري التصدير...", description: "سيتم تصدير السجل المحدد بصيغة HTML."})
      
       try {
          // This function expects orders, but we should create a dedicated export for summaries
          // For now, this will not work as intended.
          toast({ variant: "destructive", title: 'غير متاح', description: 'تصدير الملخصات غير متاح حاليًا.' });
          
      } catch (error) {
          console.error("Export failed:", error);
          toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
      }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw] w-full h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-4 bg-primary text-primary-foreground">
            <DialogTitle className="text-2xl">سجل الملخصات اليومية</DialogTitle>
            <DialogDescription className="text-primary-foreground/90">
              مرجع تاريخي لجميع الملخصات اليومية، مع إمكانية الفلترة والتصدير.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-4 p-4">
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
            <div className="flex gap-2">
                <Button variant="destructive" onClick={() => handleAction('delete')}><Trash2 className="ml-2 h-4 w-4"/> حذف الصف</Button>
                <Button variant="destructive" onClick={() => handleAction('clear')}><ListX className="ml-2 h-4 w-4"/> تفريغ القائمة</Button>
                <Button onClick={handleExport}><FileDown className="ml-2 h-4 w-4"/> تصدير HTML</Button>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-6 overflow-hidden px-4 relative">
             {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin"/></div>}
            <div className="flex-1 rounded-lg overflow-hidden border">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50 bg-primary">
                      <TableHead className="text-primary-foreground text-center">م</TableHead>
                      <TableHead className="text-primary-foreground text-center">التاريخ</TableHead>
                      <TableHead className="text-primary-foreground text-center">صافي المبيعات</TableHead>
                      <TableHead className="text-primary-foreground text-center">عدد المسترجع</TableHead>
                      <TableHead className="text-primary-foreground text-center">عدد الطلبات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSummaries.map((summary, index) => (
                      <TableRow key={summary.id} onClick={() => setSelectedSummary(summary)} className={cn('cursor-pointer', selectedSummary?.id === summary.id && 'bg-primary/20')}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="text-center">{format(summary.summary_date, "yyyy/MM/dd")}</TableCell>
                        <TableCell className="text-center font-bold">{summary.net_sales.toLocaleString('ar-SA')} ر.ي</TableCell>
                        <TableCell className="text-center text-red-500">{summary.total_refunds}</TableCell>
                        <TableCell className="text-center">{summary.total_orders}</TableCell>
                      </TableRow>
                    ))}
                     {filteredSummaries.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد ملخصات في الفترة المحددة.</TableCell>
                        </TableRow>
                     )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            
             <div className="pb-4">
                {selectedSummary ? (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-center">تفاصيل يوم {format(selectedSummary.summary_date, "yyyy/MM/dd")}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader><CardTitle>تفاصيل الدفع</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between"><span>الكاش:</span> <span className="font-bold">{selectedSummary.cash_total.toLocaleString('ar-SA')} ر.ي</span></div>
                                    <div className="flex justify-between"><span>البطاقة:</span> <span className="font-bold">{selectedSummary.card_total.toLocaleString('ar-SA')} ر.ي</span></div>
                                    <div className="flex justify-between font-bold text-primary"><span>الشبكة (بنوك):</span> <span>{selectedSummary.network_total.toLocaleString('ar-SA')} ر.ي</span></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Landmark/> تفاصيل الشبكة</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>البنك</TableHead><TableHead>المبلغ</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {Object.entries(selectedSummary.network_by_bank).map(([name, total])=>(
                                                <TableRow key={name}><TableCell>{name}</TableCell><TableCell>{total.toLocaleString('ar-SA')} ر.ي</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Users /> أداء الكاشيرات</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead className="text-center">الكاشير</TableHead><TableHead className="text-center">إجمالي المبيعات</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {selectedSummary.cashier_performance.map((c) => (
                                                <TableRow key={c.name}><TableCell className="text-center">{c.name}</TableCell><TableCell className="text-center font-bold">{c.totalSales.toLocaleString('ar-SA')} ر.ي</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag /> الأصناف الأكثر مبيعًا</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead>الكمية</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {selectedSummary.top_selling_items.map((item) => (
                                                <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell>{item.quantity}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground pt-10">
                        <p>حدد يوماً من السجل لعرض تفاصيله</p>
                    </div>
                )}
            </div>
          </div>
          <DialogFooter className="mt-auto p-4 border-t">
            <Button variant="outline" onClick={onClose}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الإجراء</AlertDialogTitle>
            <AlertDialogDescription>
              {alertAction === 'clear' ? 'هل أنت متأكد أنك تريد تفريغ السجل بالكامل؟' : 'هل أنت متأكد أنك تريد حذف الصف المحدد؟'} لا يمكن التراجع عن هذا الإجراء.
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
