'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { OrderItem } from '@/lib/types';
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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Search, Trash2, Printer, FileDown, RotateCcw, ArrowLeftRight, Pencil, Copy, ListX, BarChart2, Archive, Loader2, Globe, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';
import { PrintableReceipt } from './printable-receipt';
import { KitchenReceipt } from './kitchen-receipt';
import { cn } from '@/lib/utils';
import { EndOfDayDialog } from './end-of-day-dialog';
import { generateReportHtml } from '@/services/export-service';
import { DailySummaryLogModal } from './daily-summary-log-modal';
import type { DailySummary } from './daily-summary-log-modal';
import { SummaryReportModal } from './summary-report-modal';
import { format as formatDate, isValid } from 'date-fns';

export type Order = {
  id: number;
  date: string;
  cashier: string;
  items: OrderItem[];
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: 'نقدي' | 'شبكة' | 'بطاقة' | 'ضيافة' | 'تحويل بنكي';
  status: 'new' | 'preparing' | 'ready' | 'out-for-delivery' | 'completed' | 'rejected';
  type: 'delivery' | 'pickup';
  order_notes?: string;
  bankName?: string;
};

interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  cashierName: string;
  paymentMethod: Order['payment_method'];
  logoUrl: string | null;
  barcodeUrl: string | null;
}

const PrintComponent = React.forwardRef<HTMLDivElement, { order: Order, receiptData: ReceiptData, logoUrl: string | null, barcodeUrl: string | null }>(
  ({ order, receiptData, logoUrl, barcodeUrl }, ref) => {
    return (
      <div ref={ref}>
        <div className="break-after-page">
          <KitchenReceipt orderItems={order.items} {...receiptData} logoUrl={logoUrl} />
        </div>
        <PrintableReceipt orderItems={order.items} discount={order.discount_amount} {...receiptData} logoUrl={logoUrl} barcodeUrl={barcodeUrl} />
      </div>
    );
  }
);
PrintComponent.displayName = 'PrintComponent';


type ActionType = 'deleteInvoice' | 'clearList' | 'refund' | null;

interface OrdersLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 10;


export function OrdersLogModal({ isOpen, onClose }: OrdersLogModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isEndOfDayOpen, setIsEndOfDayOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isDailySummaryLogOpen, setIsDailySummaryLogOpen] = useState(false);
  const [showSummaryFooter, setShowSummaryFooter] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data.map((o: any) => ({
            ...o,
            final_amount: parseFloat(o.final_amount || 0),
            total_amount: parseFloat(o.total_amount || 0),
            discount_amount: parseFloat(o.discount_amount || 0),
        })));
    } catch(e) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل في جلب سجل الطلبات."});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
      if (isOpen) {
          fetchOrders();
          const fetchSettings = async () => {
              try {
                  const res = await fetch('/api/settings');
                  if(res.ok) {
                      const settings = await res.json();
                      setLogo(settings.logo_base64 || null);
                      setBarcode(settings.barcode_base64 || null);
                  }
              } catch (error) {
                  console.error("Failed to fetch settings for receipt", error);
              }
          }
          fetchSettings();
      }
  }, [isOpen, fetchOrders]);


  const selectedOrder = orders.find(order => order.id === selectedOrderId);
  
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders
        .filter(order => order.id.toString().includes(searchQuery))
        .filter(order => order.status === 'completed'); // Only show completed orders
  }, [orders, searchQuery]);
  
  const { totalOverall, totalCash, totalNetwork, refundedCount } = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
        if (order.status === 'completed') {
            acc.totalOverall += order.final_amount;
             if (order.payment_method === 'نقدي') {
                acc.totalCash += order.final_amount;
            } else if (order.payment_method === 'شبكة' || order.payment_method === 'تحويل بنكي') {
                acc.totalNetwork += order.final_amount;
            }
        } else if (order.status === 'rejected') {
            acc.refundedCount += 1;
        }
        
        return acc;
    }, {
      totalOverall: 0,
      totalCash: 0,
      totalNetwork: 0,
      refundedCount: 0,
    });
  }, [filteredOrders]);

  const paginatedOrders = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  
  useEffect(() => {
    if (selectedOrder) {
        const orderDate = new Date(selectedOrder.date);
        setReceiptData({
            receiptNumber: selectedOrder.id.toString(),
            date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(orderDate),
            time: new Intl.DateTimeFormat('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true }).format(orderDate),
            cashierName: selectedOrder.cashier,
            paymentMethod: selectedOrder.payment_method,
            logoUrl: logo,
            barcodeUrl: barcode
        })
    }
  }, [selectedOrder, logo, barcode])


  const handlePrint = () => {
    const node = printRef.current;
    if (node) {
      const printContent = node.innerHTML;
      const printWindow = window.open('', '_blank');

      if (printWindow) {
          printWindow.document.write('<html><head><title>Print</title>');
          
          printWindow.document.write(`
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Cairo:wght@400;700&display=swap" rel="stylesheet">
          `);

          printWindow.document.write('<style>');
          printWindow.document.write(`
              body { 
                  font-family: 'Cairo', 'Almarai', sans-serif;
                  margin: 0; 
                  -webkit-print-color-adjust: exact; 
                  print-color-adjust: exact; 
              }
              @page { 
                  size: 80mm auto; 
                  margin: 0;
              }
          `);
          printWindow.document.write('</style></head><body>');
          printWindow.document.write(printContent);
          printWindow.document.write('</body></html>');
          printWindow.document.close();

          printWindow.onload = () => {
              printWindow.focus();
              printWindow.print();
              printWindow.close();
          };
      }
    }
  };

  const handleActionClick = (action: ActionType) => {
    if (!selectedOrderId && action !== 'clearList') {
        toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد فاتورة أولاً.'});
        return;
    }
    if (action === 'refund' && selectedOrder?.status === 'rejected') {
        toast({ variant: 'destructive', title: 'خطأ', description: 'هذه الفاتورة مسترجعة بالفعل.'});
        return;
    }
    setActionType(action);
    setIsAlertOpen(true);
  };
  
  const handleConfirmAction = async () => {
    if (!actionType) return;
    
    setIsLoading(true);
    try {
        let description = '';
        if (actionType === 'clearList') {
            setOrders([]);
            description = `تم مسح جميع الفواتير من العرض الحالي.`;
        } else if (actionType === 'deleteInvoice' && selectedOrderId) {
            const response = await fetch(`/api/orders/${selectedOrderId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete order');
            description = `تم حذف الفاتورة رقم ${selectedOrderId}.`;
        } else if (actionType === 'refund' && selectedOrder) {
            const response = await fetch(`/api/orders/${selectedOrder.id}`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            if (!response.ok) throw new Error('Failed to refund order');
            description = `تم إرجاع الفاتورة رقم ${selectedOrder.id}. تم إعادة المنتجات إلى المخزون.`;
        }
        
        toast({ title: 'تم بنجاح', description });
        if(actionType !== 'clearList') await fetchOrders();
        setSelectedOrderId(null);

    } catch (e: any) {
        toast({ variant: "destructive", title: "خطأ", description: e.message || "فشل تنفيذ الإجراء." });
    } finally {
        setIsAlertOpen(false);
        setActionType(null);
        setIsLoading(false);
    }
  };
  
  const getActionDetails = () => {
    switch (actionType) {
      case 'deleteInvoice': return { title: 'مسح الفاتورة', description: `هل أنت متأكد أنك تريد مسح الفاتورة رقم ${selectedOrderId}؟ لا يمكن التراجع عن هذا الإجراء.` };
      case 'clearList': return { title: 'مسح القائمة', description: 'هل أنت متأكد أنك تريد مسح جميع الفواتير من القائمة؟' };
      case 'refund': return { title: 'إرجاع الفاتورة', description: `هل أنت متأكد أنك تريد إرجاع الفاتورة رقم ${selectedOrderId}؟ سيتم إعادة المنتجات إلى المخزون.` };
      default: return { title: '', description: '' };
    }
  };
    
  const handleCloseDay = () => {
    setOrders([]); // Visually clear the list for the user
    toast({
      title: 'تم إغلاق اليومية بنجاح',
      description: 'تم أرشفة السجل وإعادة تعيين الترقيم. النظام جاهز ليوم جديد.',
    });
    setIsEndOfDayOpen(false);
  };
  
  const handleExportToHtml = async () => {
    toast({ title: 'جاري إنشاء التقرير...', description: 'يتم تجهيز تقرير HTML.' });

    try {
      const reportHtml = await generateReportHtml(filteredOrders, undefined, logo || undefined);
      const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales-report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل التقرير.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
    }
  }


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
          {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin"/></div>}
          <DialogHeader className="p-4 bg-primary text-primary-foreground">
            <DialogTitle>سجل الطلبات</DialogTitle>
            <DialogDescription className="text-primary-foreground/90">
              ابحث عن الطلبات السابقة وقم بإدارتها.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-12 gap-6 pt-4 p-4">
              {/* Main content - Orders Table */}
              <div className="col-span-12 md:col-span-9 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Input
                    placeholder="بحث عن فاتورة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Card className="flex-1 flex flex-col overflow-hidden">
                  <CardContent className="p-0 flex-1">
                    <ScrollArea className="h-[calc(100vh-25rem)]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary hover:bg-primary/90">
                            <TableHead className="text-primary-foreground text-center">رقم الفاتورة</TableHead>
                            <TableHead className="text-primary-foreground text-center">تاريخ الفاتورة</TableHead>
                            <TableHead className="text-primary-foreground text-center">نوع الطلب</TableHead>
                            <TableHead className="text-primary-foreground text-center">الكاشير</TableHead>
                            <TableHead className="text-primary-foreground text-center">المنتجات</TableHead>
                            <TableHead className="text-primary-foreground text-center">الإجمالي</TableHead>
                            <TableHead className="text-primary-foreground text-center">الخصم</TableHead>
                            <TableHead className="text-primary-foreground text-center">الصافي</TableHead>
                            <TableHead className="text-primary-foreground text-center">الدفع</TableHead>
                            <TableHead className="text-primary-foreground text-center">ملاحظات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedOrders.map((order) => {
                            const orderDate = new Date(order.date);
                            const displayDate = isValid(orderDate)
                              ? formatDate(orderDate, 'dd/MM/yyyy, hh:mm a')
                              : 'Invalid Date';
                            
                            let notes = order.order_notes || '-';
                             if (order.payment_method === 'تحويل بنكي' && order.order_notes) {
                                const bankMatch = order.order_notes.match(/تحويل بنكي عبر:\s*(.*)/);
                                if (bankMatch) {
                                  notes = `تحويل: ${bankMatch[1]}`;
                                }
                            } else if (order.payment_method === 'شبكة' && order.bankName) {
                                notes = `شبكة: ${order.bankName}`;
                            }


                            const orderTypeDisplay = order.type === 'pickup' ? 'محلي' : 'أونلاين';
                            return (
                              <TableRow
                                key={order.id}
                                onClick={() => setSelectedOrderId(order.id)}
                                className={cn(
                                  'cursor-pointer',
                                  selectedOrderId === order.id && 'bg-primary/20',
                                  order.status === 'rejected' && 'line-through text-muted-foreground/50'
                                )}
                              >
                                <TableCell className="font-medium text-center">{order.id}</TableCell>
                                <TableCell className="text-center">{displayDate}</TableCell>
                                <TableCell className="text-center">{orderTypeDisplay}</TableCell>
                                <TableCell className="text-center">{order.cashier}</TableCell>
                                <TableCell className="text-center">{order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}</TableCell>
                                <TableCell className="text-center">{order.total_amount?.toLocaleString('ar-SA')}</TableCell>
                                <TableCell className="text-center text-red-600">{order.discount_amount > 0 ? `${order.discount_amount.toLocaleString('ar-SA')}` : '-'}</TableCell>
                                <TableCell className="text-center font-bold">{order.final_amount?.toLocaleString('ar-SA')}</TableCell>
                                <TableCell className="text-center">{order.payment_method}</TableCell>
                                <TableCell className="text-center">{notes}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                  {showSummaryFooter && (
                    <CardFooter className="p-2 border-t flex justify-between items-center">
                        <div className="flex-grow flex items-center gap-4 text-sm font-semibold">
                          <span>الإجمالي: <span className="text-green-600">{totalOverall.toLocaleString('ar-SA')} ر.ي</span></span>
                          <span>الكاش: <span className="text-blue-600">{totalCash.toLocaleString('ar-SA')} ر.ي</span></span>
                          <span>الشبكة: <span className="text-purple-600">{totalNetwork.toLocaleString('ar-SA')} ر.ي</span></span>
                          <span>المسترجع: <span className="text-red-600">{refundedCount}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                السابق
                            </Button>
                            <span className="text-sm font-medium">
                              صفحة {currentPage} من {totalPages}
                            </span>
                            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                التالي
                            </Button>
                        </div>
                    </CardFooter>
                   )}
                </Card>
              </div>

              {/* Action Panel */}
              <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
                  <Card>
                      <CardHeader>
                          <CardTitle>الإجراءات</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="flex-col h-20 text-center" onClick={() => handleActionClick('deleteInvoice')}><Trash2 className="mb-1" /><span>مسح الفاتورة</span></Button>
                          <Button variant="outline" className="flex-col h-20 text-center" onClick={() => handleActionClick('clearList')}><ListX className="mb-1" /><span>مسح القائمة</span></Button>
                          <Button variant="outline" className="flex-col h-20 text-center text-destructive border-destructive" onClick={() => handleActionClick('refund')}><ArrowLeftRight className="mb-1" /><span>مسترجع</span></Button>
                          <Button variant="outline" className="flex-col h-20 text-center" onClick={fetchOrders}><RotateCcw className="mb-1" /><span>تحديث</span></Button>
                          <Button variant="outline" className="flex-col h-20 text-center" onClick={handleExportToHtml}><FileDown className="mb-1" /><span>تصدير</span></Button>
                          <Button variant="outline" className="flex-col h-20 text-center" onClick={() => setIsEndOfDayOpen(true)}><Pencil className="mb-1" /><span>إغلاق اليومية</span></Button>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                        <CardTitle>الطباعة والملخصات</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 grid grid-cols-1 gap-3">
                          <Button variant="secondary" className="h-12" onClick={handlePrint} disabled={!selectedOrder}><Printer className="mr-2" /> طباعة</Button>
                          <Button variant="secondary" className="h-12" onClick={() => toast({ title: "تم نسخ الفاتورة" })}><Copy className="mr-2" /> نسخ الفاتورة</Button>
                          <Button variant="secondary" className="h-12" onClick={() => setShowSummaryFooter(prev => !prev)}><BarChart2 className="mr-2" /> {showSummaryFooter ? 'إخفاء' : 'إظهار'} الملخص</Button>
                          <Button variant="secondary" className="h-12" onClick={() => setIsSummaryModalOpen(true)}><FileDown className="mr-2" /> عرض تقرير الملخص</Button>
                          <Button variant="secondary" className="h-12" onClick={() => setIsDailySummaryLogOpen(true)}><Archive className="mr-2" /> سجل الملخصات</Button>
                      </CardContent>
                  </Card>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        {selectedOrder && receiptData && <PrintComponent ref={printRef} order={selectedOrder} receiptData={receiptData} logoUrl={logo} barcodeUrl={barcode} />}
      </div>
      
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
            <AlertDialogAction onClick={handleConfirmAction} className={cn(actionType === 'deleteInvoice' || actionType === 'clearList' ? "bg-destructive hover:bg-destructive/90" : "")}>
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EndOfDayDialog
        isOpen={isEndOfDayOpen}
        onClose={() => setIsEndOfDayOpen(false)}
        onConfirm={handleCloseDay}
        orders={orders}
      />
      
      <DailySummaryLogModal
        isOpen={isDailySummaryLogOpen}
        onClose={() => setIsDailySummaryLogOpen(false)}
      />

      <SummaryReportModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />
    </>
  );
}
