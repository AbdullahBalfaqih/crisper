'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

type User = {
  id: string;
  full_name: string;
  role: 'system_admin' | 'employee' | 'customer';
};

type Order = {
  id: number;
  date: string;
  cashier: string;
  user_id?: string;
  items: OrderItem[];
  discount_amount: number;
  payment_method: 'نقدي' | 'شبكة' | 'بطاقة' | 'ضيافة' | 'تحويل بنكي';
  status: 'new' | 'preparing' | 'ready' | 'out-for-delivery' | 'completed' | 'rejected';
  final_amount: number;
  bankName?: string;
  order_notes?: string;
};

interface EndOfDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orders: Order[];
}

export function EndOfDayDialog({ isOpen, onClose, onConfirm, orders }: EndOfDayDialogProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const res = await fetch('/api/users');
          if (!res.ok) throw new Error('Failed to fetch users');
          setUsers(await res.json());
        } catch (e) {
          console.error("Could not fetch users for End of Day dialog", e);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const summary = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === 'completed');
    const refundedOrders = orders.filter(o => o.status === 'rejected');

    const netSales = activeOrders.reduce((sum, order) => sum + order.final_amount, 0);
    const totalRefunds = refundedOrders.length;

    const cash_total = activeOrders
        .filter(order => order.payment_method === 'نقدي')
        .reduce((sum, order) => sum + order.final_amount, 0);

    const network_total = activeOrders
        .filter(order => order.payment_method === 'شبكة' || order.payment_method === 'تحويل بنكي')
        .reduce((sum, order) => sum + order.final_amount, 0);
    
    const cardTotal = activeOrders
        .filter(order => order.payment_method === 'بطاقة')
        .reduce((sum, order) => sum + order.final_amount, 0);
    
    const networkByBank = activeOrders
      .filter(order => (order.payment_method === 'شبكة' || order.payment_method === 'تحويل بنكي'))
      .reduce((acc, order) => {
        const bankName = (order.payment_method === 'تحويل بنكي' && order.order_notes)
            ? order.order_notes.replace('تحويل بنكي عبر:', '').trim() 
            : order.bankName;
        
        if (bankName) {
            if (!acc[bankName]) acc[bankName] = 0;
            acc[bankName] += order.final_amount;
        }
        return acc;
    }, {} as Record<string, number>);

    const itemCounts = activeOrders.flatMap(o => o.items).reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity;
        return acc;
    }, {} as {[key: string]: number});
    
    const topSellingItems = Object.entries(itemCounts).sort(([,a], [,b]) => b - a).slice(0, 5).map(([name, quantity]) => ({name, quantity}));

    const cashierPerformance = activeOrders
        .filter(order => {
          const userIsCustomer = users.find(u => u.full_name === order.cashier && u.role === 'customer');
          return !userIsCustomer && order.cashier !== 'غير مسجل';
        })
        .reduce((acc, order) => {
            const cashierName = order.cashier || 'غير معروف';
            if (!acc[cashierName]) {
                acc[cashierName] = { totalSales: 0, orderCount: 0 };
            }
            acc[cashierName].totalSales += order.final_amount;
            acc[cashierName].orderCount += 1;
            return acc;
        }, {} as {[key: string]: { totalSales: number, orderCount: number }});
    
    return {
      summary_date: new Date(),
      net_sales: netSales,
      total_refunds: totalRefunds,
      total_orders: activeOrders.length,
      cash_total: cash_total,
      card_total: cardTotal,
      network_total: network_total,
      network_by_bank: networkByBank,
      top_selling_items: topSellingItems,
      cashier_performance: Object.entries(cashierPerformance).map(([name, data])=> ({name, ...data})),
    };
  }, [orders, users]);

  const handleConfirm = async () => {
    try {
      const summaryResponse = await fetch('/api/daily-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary)
      });
      if (!summaryResponse.ok) {
        throw new Error('Failed to save daily summary');
      }
      
      const archiveResponse = await fetch('/api/orders/archive', {
        method: 'POST',
      });
      if (!archiveResponse.ok) {
          throw new Error('Failed to archive orders and reset sequence');
      }

      onConfirm();
    } catch(e: any) {
      console.error(e);
      toast({variant: 'destructive', title: 'فشل إغلاق اليومية', description: e.message});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">إغلاق وأرشفة اليومية</DialogTitle>
          <DialogDescription className="text-center">
            هذا الإجراء سيقوم بأرشفة بيانات اليوم الحالي في قاعدة البيانات وتصفير السجل ليوم جديد. هل أنت متأكد؟
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h3 className="text-lg font-semibold text-center">ملخص الإغلاق الحالي</h3>
                <Separator />
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>صافي المبيعات:</span> <span className="font-bold text-green-600">{summary.net_sales.toFixed(2)} ر.ي</span></div>
                    <div className="flex justify-between"><span>إجمالي المسترجع:</span> <span className="font-bold text-red-600">{summary.total_refunds} فاتورة</span></div>
                </div>
                <Separator />
                 <div className="space-y-2 text-sm">
                    <h4 className="font-semibold text-center mb-2">تفاصيل الدفع</h4>
                    <div className="flex justify-between"><span>الكاش:</span> <span>{(summary.cash_total || 0).toFixed(2)} ر.ي</span></div>
                    <div className="flex justify-between"><span>الشبكة:</span> <span>{(summary.network_total || 0).toFixed(2)} ر.ي</span></div>
                    {Object.entries(summary.network_by_bank).length > 0 && (
                      <div className="pr-4 mt-1 border-r-2 border-primary/50">
                        {Object.entries(summary.network_by_bank).map(([bank, total]) => (
                          <div key={bank} className="flex justify-between text-xs text-muted-foreground">
                            <span>- {bank}:</span>
                            <span>{total.toFixed(2)} ر.ي</span>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
                 <Separator />
                 <div>
                    <h4 className="font-semibold text-center mb-2">الأصناف الأكثر مبيعًا</h4>
                    <div className="space-y-1 text-sm">
                       {summary.top_selling_items?.map(({name, quantity}) => (
                           <div key={name} className="flex justify-between items-center">
                               <span>- {name}</span>
                               <span className="font-bold">{quantity} وحدة</span>
                           </div>
                       ))}
                    </div>
                 </div>
                 <Separator />
                 <div>
                    <h4 className="font-semibold text-center mb-2">أداء الكاشيرات</h4>
                     <Table>
                        <TableHeader>
                           <TableRow><TableHead className="text-center h-8">الكاشير</TableHead><TableHead className="text-center h-8">إجمالي المبيعات</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.cashier_performance.map(({name, totalSales}) => (
                                <TableRow key={name}><TableCell className="py-1 text-center">{name}</TableCell><TableCell className="py-1 text-center font-bold">{totalSales.toLocaleString('ar-SA')} ر.ي</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant="destructive" onClick={handleConfirm}>تأكيد وإغلاق اليومية</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
