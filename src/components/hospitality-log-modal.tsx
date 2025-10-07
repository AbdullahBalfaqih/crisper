'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Trash2, ListX, FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';
import { generateHospitalityHtmlReport } from '@/app/export/actions';

interface HospitalityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Hospitality = { id: number; employee: string; date: string; total: number; user: string; notes: string; };
type ActionType = 'deleteInvoice' | 'clearList' | null;

export function HospitalityLogModal({ isOpen, onClose }: HospitalityLogModalProps) {
  const [hospitality, setHospitality] = useState<Hospitality[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchHospitalityLog = async () => {
      setIsLoading(true);
      try {
          const response = await fetch('/api/hospitality');
          if (!response.ok) throw new Error("Failed to fetch hospitality log");
          const data = await response.json();
          setHospitality(data);
      } catch (error) {
          toast({ variant: 'destructive', title: "خطأ", description: "فشل في جلب سجل الضيافة."})
      } finally {
          setIsLoading(false);
      }
  }

  useEffect(() => {
    if (isOpen) {
        fetchHospitalityLog();
    }
  }, [isOpen]);

  const handleActionClick = (action: ActionType) => {
    if (!selectedInvoice && action !== 'clearList') {
        toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد فاتورة ضيافة أولاً.'});
        return;
    }
    setActionType(action);
    setIsAlertOpen(true);
  };
  
  const handleConfirmAction = async () => {
    if (!actionType) return;
    
    setIsLoading(true);
    try {
        let response;
        if (actionType === 'clearList') {
            response = await fetch('/api/hospitality', { method: 'DELETE' });
        } else if (selectedInvoice && actionType === 'deleteInvoice') {
            response = await fetch(`/api/hospitality?id=${selectedInvoice}`, { method: 'DELETE' });
        }

        if (response && !response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to perform action');
        }

        toast({ title: 'تم بنجاح', description: 'تم تنفيذ الإجراء بنجاح.' });
        await fetchHospitalityLog(); // Refetch data
        setSelectedInvoice(null);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
        setIsLoading(false);
        setIsAlertOpen(false);
        setActionType(null);
    }
  };
  
  const getActionDetails = () => {
    switch (actionType) {
      case 'deleteInvoice': return { title: 'مسح فاتورة الضيافة', description: `هل أنت متأكد أنك تريد مسح الفاتورة رقم ${selectedInvoice}؟ لا يمكن التراجع عن هذا الإجراء.` };
      case 'clearList': return { title: 'مسح القائمة', description: 'هل أنت متأكد أنك تريد مسح جميع فواتير الضيافة من القائمة؟' };
      default: return { title: '', description: '' };
    }
  };

  const filteredInvoices = hospitality.filter(item => 
    item.id.toString().includes(searchQuery) ||
    item.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.user.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalHospitality = filteredInvoices.reduce((sum, item) => sum + item.total, 0);
  
  const handleExport = async () => {
    toast({ title: 'جاري إنشاء التقرير...', description: 'يتم تجهيز تقرير HTML.' });
    try {
      const reportHtml = await generateHospitalityHtmlReport(filteredInvoices);
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hospitality-log-report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل تقرير الضيافة.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
    }
  }


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 bg-primary text-primary-foreground">
            <DialogTitle>سجل الضيافة</DialogTitle>
            <DialogDescription className="text-primary-foreground/90">
              عرض وإدارة فواتير الضيافة.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex flex-col gap-4 overflow-hidden p-6 relative">
             {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            <div className="flex items-center gap-2">
              <Input
                placeholder="بحث برقم الفاتورة، الموظف، أو المستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
               <Button variant="outline" className="mr-auto" onClick={handleExport}><FileDown className="ml-2"/> تصدير</Button>
            </div>
            <Card className="flex-1 flex flex-col">
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary">
                        <TableHead className="text-primary-foreground text-center">رقم الضيافة</TableHead>
                        <TableHead className="text-primary-foreground text-center">اسم الموظف</TableHead>
                        <TableHead className="text-primary-foreground text-center">التاريخ</TableHead>
                        <TableHead className="text-primary-foreground text-center">الإجمالي</TableHead>
                        <TableHead className="text-primary-foreground text-center">المستخدم</TableHead>
                        <TableHead className="text-primary-foreground text-center">الملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((item) => (
                        <TableRow
                          key={item.id}
                          onClick={() => setSelectedInvoice(item.id)}
                          className={`cursor-pointer ${selectedInvoice === item.id ? 'bg-muted/80' : ''}`}
                        >
                          <TableCell className="font-medium text-center">{item.id}</TableCell>
                          <TableCell className="text-center">{item.employee}</TableCell>
                          <TableCell className="text-center">{item.date}</TableCell>
                          <TableCell className="text-center">{item.total.toLocaleString('ar-SA')} ر.ي</TableCell>
                          <TableCell className="text-center">{item.user}</TableCell>
                          <TableCell className="text-center">{item.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                      إجمالي الضيافة: <span className="font-bold text-foreground">{totalHospitality.toLocaleString('ar-SA')} ر.ي</span>
                  </div>
                   <div className="flex gap-2">
                     <Button variant="destructive" onClick={() => handleActionClick('deleteInvoice')}><Trash2 className="ml-2 h-4 w-4" /> مسح الفاتورة</Button>
                     <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleActionClick('clearList')}><ListX className="ml-2 h-4 w-4" /> مسح القائمة</Button>
                     <Button variant="ghost" onClick={onClose}>الرجوع</Button>
                   </div>
              </CardFooter>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getActionDetails().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDetails().description}
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
