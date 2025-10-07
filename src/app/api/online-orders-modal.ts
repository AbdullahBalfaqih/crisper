'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, FileText, Server, Clock, Utensils, Bike, Phone, CreditCard, Mail, MapPin, ClipboardList, Trash2, CheckCheck, PackageCheck, Image as ImageIcon, Printer, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderDetailsSheet, type OnlineOrder, OrderStatus, OrderType } from './order-details-sheet';
import { AssignDriverDialog } from './assign-driver-dialog';
import { PrintOnlineReceipt } from './print-online-receipt';
import { KitchenReceipt } from './kitchen-receipt';
import type { OrderItem } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import type { Driver } from './delivery-modal';


interface OnlineOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const allStatuses: OrderStatus[] = ['new', 'preparing', 'ready', 'out-for-delivery', 'completed', 'rejected'];

const statusConfig: { [key in OrderStatus]: { label: string; icon: React.ElementType; color: string; hoverColor: string } } = {
    new: { label: 'جديد', icon: Server, color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600' },
    preparing: { label: 'قيد التجهيز', icon: Clock, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
    ready: { label: 'جاهز', icon: PackageCheck, color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600' },
    'out-for-delivery': { label: 'قيد التوصيل', icon: Bike, color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-600'},
    completed: { label: 'مكتمل', icon: CheckCheck, color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
    rejected: { label: 'مرفوض', icon: X, color: 'bg-red-500', hoverColor: 'hover:bg-red-600' }
};

interface ReceiptData {
    receiptNumber: string;
    date: string;
    time: string;
    cashierName: string;
    paymentMethod: any;
    logoUrl: string | null;
    barcodeUrl: string | null;
}

const PrintOnlineComponent = React.forwardRef<HTMLDivElement, { order: OnlineOrder, receiptData: ReceiptData }>(
    ({ order, receiptData }, ref) => {
        const orderItems: OrderItem[] = useMemo(() => {
            return order.items.map((item, index) => {
                return {
                    id: `online-item-${index}`,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    notes: item.notes,
                    categoryId: 'online',
                    imageUrl: '',
                    imageHint: '',
                };
            });
        }, [order]);

        return (
             <div ref={ref}>
                <div style={{ pageBreakAfter: 'always' }}>
                    <KitchenReceipt orderItems={orderItems} {...receiptData} />
                </div>
                <PrintOnlineReceipt orderItems={orderItems} discount={0} {...receiptData} />
            </div>
        );
    }
);
PrintOnlineComponent.displayName = 'PrintOnlineComponent';


export function OnlineOrdersModal({ isOpen, onClose }: OnlineOrdersModalProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<OnlineOrder | null>(null);
  const [orderToAssign, setOrderToAssign] = useState<OnlineOrder | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<OrderType>('delivery');
  const [alertContent, setAlertContent] = useState<{ title: string; description: string; onConfirm: () => void; } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchOnlineOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders?online=true');
      if (!response.ok) throw new Error('Failed to fetch online orders');
      const data = await response.json();
      setOrders(data.map((o: any) => ({...o, date: new Date(o.created_at)})));
    } catch (e) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب طلبات الأونلاين.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
   useEffect(() => {
    if (isOpen) {
      fetchOnlineOrders();
      const fetchSettings = async () => {
        try {
          const res = await fetch('/api/settings');
          if (res.ok) {
            const settings = await res.json();
            setLogoUrl(settings.logo_base64 || null);
            setBarcodeUrl(settings.barcode_base64 || null);
          }
        } catch (e) {
          console.error("Failed to fetch settings for online orders");
        }
      };
      fetchSettings();
    }
  }, [isOpen, fetchOnlineOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
        const typeMatch = o.type === activeTypeFilter;
        const statusMatch = activeStatusFilter === 'all' ? o.status !== 'rejected' : o.status === activeStatusFilter;
        return typeMatch && statusMatch;
    });
  }, [orders, activeStatusFilter, activeTypeFilter]);

  const openWhatsApp = (phone: string, message: string) => {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  const handleUpdateStatus = (order: OnlineOrder, newStatus: OrderStatus) => {
    setAlertContent({
      title: `تأكيد تحديث الحالة`,
      description: `هل أنت متأكد أنك تريد تغيير حالة الطلب ${order.id} إلى "${statusConfig[newStatus].label}"؟`,
      onConfirm: async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/orders/${order.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to update status');

            await fetchOnlineOrders(); // Refetch to get the latest state

            toast({
                title: 'تم تحديث حالة الطلب',
                description: `تم تحديث حالة الطلب ${order.id} إلى ${statusConfig[newStatus].label}.`
            });

            // const message = `مرحباً ${order.customer}, طلبك رقم ${order.id} الآن "${statusConfig[newStatus].label}".`;
            // openWhatsApp(order.phone, message);

        } catch (e) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث حالة الطلب.' });
        } finally {
            setAlertContent(null);
            setIsLoading(false);
        }
      },
    });
  }

  const handleRejectOrder = (order: OnlineOrder) => {
    handleUpdateStatus(order, 'rejected');
  }

  const handleDeleteOrder = (order: OnlineOrder) => {
    setAlertContent({
      title: 'تأكيد الحذف',
      description: `هل أنت متأكد أنك تريد حذف الطلب ${order.id} نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`,
      onConfirm: async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete order');
            toast({
                variant: 'destructive',
                title: 'تم حذف الطلب',
                description: `تم حذف الطلب ${order.id} نهائياً.`
            });
            await fetchOnlineOrders();
        } catch(e) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الطلب.' });
        } finally {
            setAlertContent(null);
            setIsLoading(false);
        }
      },
    });
  }

  const handleShowDetails = (order: OnlineOrder) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  }
  
  const handleAssignDriver = async (order: OnlineOrder, driver: Driver, commission: number) => {
    setIsLoading(true);
    try {
        const response = await fetch(`/api/delivery-missions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order.id, driverId: driver.id, commission }),
        });
        if (!response.ok) throw new Error('Failed to assign driver');

        toast({
            title: 'تم إسناد المهمة',
            description: `تم إسناد الطلب ${order.id} للسائق ${driver.name}.`
        });
        
        await fetchOnlineOrders();
        // Notify customer and driver logic remains...
    } catch(e) {
         toast({ variant: 'destructive', title: 'خطأ', description: 'فشل إسناد المهمة للسائق.' });
    } finally {
        setIsAssignDialogOpen(false);
        setOrderToAssign(null);
        setIsLoading(false);
    }
  }
  
  const handlePrint = (order: OnlineOrder) => {
    setOrderToPrint(order);
    setTimeout(() => {
        const printContent = receiptRef.current;
        const printWindow = window.open('', '_blank');
        if (printWindow && printContent) {
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
                    direction: rtl;
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact;
                }
                @page { 
                    size: 80mm auto; 
                    margin: 0mm;
                }
            `);
            printWindow.document.write('</style></head><body>');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();

            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
                setOrderToPrint(null);
            };
        } else {
             setOrderToPrint(null);
        }
    }, 100);
  }

  const getStatusBadge = (status: 'مدفوع' | 'غير مدفوع') => {
    return status === 'مدفوع' ? <Badge variant="default" className="bg-green-600">مدفوع</Badge> : <Badge variant="destructive">غير مدفوع</Badge>;
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0">
        {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin"/></div>}
        <DialogHeader className="p-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-2xl flex items-center gap-2"><Server /> طلبات الأونلاين</DialogTitle>
          <DialogDescription className="text-primary-foreground/90">
            إدارة وقبول الطلبات الواردة من المنصات الإلكترونية.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
            <div className="flex justify-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Button onClick={() => setActiveTypeFilter('delivery')} variant={activeTypeFilter === 'delivery' ? 'secondary' : 'ghost'} className={cn("flex-1 h-12 ring-2 ring-transparent", activeTypeFilter === 'delivery' && "ring-primary")}>طلبات التوصيل</Button>
                <Button onClick={() => setActiveTypeFilter('pickup')} variant={activeTypeFilter === 'pickup' ? 'secondary' : 'ghost'} className={cn("flex-1 h-12 ring-2 ring-transparent", activeTypeFilter === 'pickup' && "ring-primary")}>طلبات الحجز (استلام)</Button>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="flex gap-1 sm:gap-2 flex-wrap">
                    <Button onClick={() => setActiveStatusFilter('all')} variant={activeStatusFilter === 'all' ? 'secondary' : 'ghost'} className="h-8 sm:h-auto">الكل</Button>
                    {Object.entries(statusConfig).filter(([key]) => key !== 'rejected').map(([status, config]) => (
                        <Button key={status} onClick={() => setActiveStatusFilter(status as OrderStatus)} variant={activeStatusFilter === status ? 'secondary' : 'ghost'} className={cn('h-8 sm:h-auto', activeStatusFilter === status ? config.color + ' text-white' : '')}>{config.label}</Button>
                    ))}
                </div>
                <Button variant="ghost" onClick={fetchOnlineOrders}><RefreshCw className="ml-2 h-4 w-4"/> تحديث</Button>
            </div>
        </div>

        <ScrollArea className="flex-1 mt-0 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredOrders.map(order => {
                    const config = statusConfig[order.status as OrderStatus] || statusConfig.new;
                    return (
                        <Card key={order.id} className={cn("flex flex-col border-2 hover:border-primary/70 transition-colors", `border-${config.color.replace('bg-', '')}`)}>
                           <CardHeader className="flex-row items-start justify-between gap-4 p-4">
                                <Badge className={cn("text-white", config.color)}>{config.label}</Badge>
                                <div className="flex-1 text-right">
                                    <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{order.date.toLocaleTimeString('ar-SA')}</p>
                                </div>
                           </CardHeader>
                           <CardContent className="p-4 pt-0 space-y-3 text-sm flex-1 text-right">
                               <div className="flex items-start justify-end gap-3 text-foreground">
                                   <span className="flex-1 text-right">{order.customer_phone}</span>
                                   <Phone className="w-4 h-4 text-primary mt-1"/>
                               </div>
                               <div className="flex items-start justify-end gap-3 text-foreground">
                                   <div className="flex-1">
                                       {order.items.map((item: any, index: number) => (
                                          <div key={index} className="flex flex-col text-right">
                                            <span>{item.quantity}x {item.name}</span>
                                            {item.notes && <span className="text-xs text-yellow-600/80 mr-2">- {item.notes}</span>}
                                          </div>
                                       ))}
                                   </div>
                                    <Utensils className="w-4 h-4 text-primary mt-1"/>
                               </div>
                               <div className="flex items-center justify-end gap-3 text-foreground">
                                   <div className="flex items-center gap-2 flex-1 justify-end">
                                      {order.payment_proof_url && <button onClick={() => handleShowDetails(order)}><ImageIcon className="w-4 h-4 text-primary"/></button>}
                                      <span>{order.payment_method} - {getStatusBadge(order.payment_status as any)}</span>
                                   </div>
                                   <CreditCard className="w-4 h-4 text-primary"/>
                               </div>
                               {order.type === 'delivery' && order.address_id && (
                                <div className="flex items-start justify-end gap-3 text-foreground">
                                   <span className="flex-1 text-right">
                                        {/* In a real app, this would fetch address details */}
                                        تفاصيل العنوان غير متاحة
                                   </span>
                                   <MapPin className="w-4 h-4 text-primary mt-1"/>
                               </div>
                               )}
                               {order.order_notes && (
                                <div className="flex items-start justify-end gap-3 text-foreground">
                                   <span className="flex-1 text-right">{order.order_notes}</span>
                                    <ClipboardList className="w-4 h-4 text-primary mt-1"/>
                               </div>
                               )}
                           </CardContent>
                            <CardFooter className="p-2 border-t mt-auto flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleShowDetails(order)}><FileText className="h-5 w-5" /></Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleDeleteOrder(order)}><Trash2 className="h-5 w-5 text-destructive" /></Button>
                                    {order.status !== 'new' && order.status !== 'rejected' && (
                                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handlePrint(order)}>
                                            <Printer className="h-5 w-5 text-sky-500"/>
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button size="sm" variant="destructive" className="px-4" onClick={() => handleRejectOrder(order)}>رفض</Button>
                                    {order.status === 'new' && (
                                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white px-4" onClick={() => handleUpdateStatus(order, 'preparing')}>قبول</Button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black px-4" onClick={() => handleUpdateStatus(order, 'ready')}>جاهز</Button>
                                    )}
                                    {order.status === 'ready' && order.type === 'delivery' && (
                                        <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white px-4" onClick={() => { setOrderToAssign(order); setIsAssignDialogOpen(true); }}>إسناد لسائق</Button>
                                    )}
                                    {order.status === 'ready' && order.type === 'pickup' && (
                                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white px-4" onClick={() => handleUpdateStatus(order, 'completed')}>تم الاستلام</Button>
                                    )}
                                    {order.status === 'out-for-delivery' && (
                                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white px-4" onClick={() => handleUpdateStatus(order, 'completed')}>تم التوصيل</Button>
                                    )}
                                </div>
                           </CardFooter>
                        </Card>
                    )
                })}
                 {filteredOrders.length === 0 && !isLoading && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        <p>لا توجد طلبات تطابق الفلتر المحدد.</p>
                    </div>
                )}
            </div>
        </ScrollArea>

        <DialogFooter className="mt-auto p-2 border-t -mx-4 -mb-4">
            <Button variant="secondary" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {selectedOrder && (
        <OrderDetailsSheet 
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            order={selectedOrder}
        />
    )}

    {orderToAssign && (
        <AssignDriverDialog
            isOpen={isAssignDialogOpen}
            onClose={() => { setIsAssignDialogOpen(false); setOrderToAssign(null); }}
            onAssign={handleAssignDriver}
            order={orderToAssign}
        />
    )}
    
    {alertContent && (
      <AlertDialog open={!!alertContent} onOpenChange={() => setAlertContent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertContent(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={alertContent.onConfirm}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}

    <div className="hidden">
        {orderToPrint && 
          <PrintOnlineComponent 
            ref={receiptRef} 
            order={orderToPrint} 
            receiptData={{
                receiptNumber: orderToPrint.id.toString().padStart(3, '0'),
                date: new Date(orderToPrint.date).toLocaleDateString('en-GB'),
                time: new Date(orderToPrint.date).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit', hour12: true }),
                cashierName: user?.full_name || "Online",
                paymentMethod: orderToPrint.payment_method as any,
                logoUrl,
                barcodeUrl
            }}
          />
        }
    </div>

    </>
  );
}
