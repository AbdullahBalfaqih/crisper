'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
import { Wallet, Briefcase, BarChart2, Users, ShoppingBag, Landmark, Loader2 } from 'lucide-react';
import type { OrderItem } from '@/lib/types';
import type { Order } from './orders-log-modal';
import type { Transaction } from './accounting-fund-modal';
import { useToast } from '@/hooks/use-toast';


interface SummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SummaryReportModal({ isOpen, onClose }: SummaryReportModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<{id: string, role: string, full_name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [ordersRes, transRes, usersRes] = await Promise.all([
            fetch('/api/orders'),
            fetch('/api/transactions'),
            fetch('/api/users')
          ]);

          if (!ordersRes.ok || !transRes.ok || !usersRes.ok) {
            throw new Error('فشل في جلب بيانات الملخص.');
          }

          const ordersData = await ordersRes.json();
          const transData = await transRes.json();
          const usersData = await usersRes.json();

          setOrders(ordersData);
          setTransactions(transData.map((t: any) => ({ ...t, amount: parseFloat(t.amount) })));
          setUsers(usersData);

        } catch (error: any) {
          toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, toast]);

  
  const summary = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === 'completed');
    const refundedOrders = orders.filter(o => o.status === 'rejected');
    
    const netSales = activeOrders.reduce((sum, order) => sum + order.final_amount, 0);
    const totalRefundsCount = refundedOrders.length;
    const totalRefundsValue = refundedOrders.reduce((sum, order) => sum + order.final_amount, 0);

    const cashTotal = activeOrders.filter(o => o.payment_method === 'نقدي').reduce((sum, order) => sum + order.final_amount, 0);
    const cardTotal = activeOrders.filter(o => o.payment_method === 'بطاقة').reduce((sum, order) => sum + order.final_amount, 0);
    const networkTotal = activeOrders.filter(o => o.payment_method === 'شبكة' || o.payment_method === 'تحويل بنكي').reduce((sum, order) => sum + order.final_amount, 0);
    
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
    
    const topSellingItems = Object.entries(itemCounts).sort(([,a], [,b]) => b - a).slice(0, 5);
    
    const cashierPerformance = activeOrders
      .filter(order => {
        // Filter out orders where the cashier is a known customer
        const userIsCustomer = users.find(u => u.full_name === order.cashier && u.role === 'customer');
        const isNotRegistered = order.cashier === 'غير مسجل';
        return !userIsCustomer && !isNotRegistered;
      })
      .reduce((acc, order) => {
        const cashierName = order.cashier || 'غير معروف';
        if (!acc[cashierName]) {
          acc[cashierName] = { totalSales: 0, orderCount: 0 };
        }
        acc[cashierName].totalSales += order.final_amount;
        acc[cashierName].orderCount += 1;
        return acc;
      }, {} as { [key: string]: { totalSales: number; orderCount: number } });

    
    return {
      netSales,
      totalRefundsValue,
      totalRefundsCount,
      cashTotal,
      cardTotal,
      networkTotal,
      networkByBank: Object.entries(networkByBank),
      totalOrders: activeOrders.length,
      topSellingItems,
      cashierPerformance: Object.entries(cashierPerformance),
    };
  }, [orders, users]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">ملخص اليومية</DialogTitle>
          <DialogDescription>
            نظرة شاملة على أداء المبيعات اليومي.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-6 flex-1 px-6">
           {isLoading ? (
             <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
          ) : (
          <div className="space-y-4 py-4">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">صافي المبيعات</CardTitle>
                  <Wallet className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.netSales.toLocaleString('ar-EG')} ر.ي</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المسترجع</CardTitle>
                  <Briefcase className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalRefundsValue.toLocaleString('ar-EG')} ر.ي</div>
                   <p className="text-xs text-muted-foreground">({summary.totalRefundsCount} فواتير)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">عدد الطلبات</CardTitle>
                  <BarChart2 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalOrders}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
               <Card>
                  <CardHeader>
                      <CardTitle>تفاصيل الدفع</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                      <div className="flex justify-between"><span>الكاش:</span> <span className="font-bold">{summary.cashTotal.toLocaleString('ar-EG')} ر.ي</span></div>
                      <div className="flex justify-between"><span>البطاقة (فيزا):</span> <span className="font-bold">{summary.cardTotal.toLocaleString('ar-EG')} ر.ي</span></div>
                      <div className="flex justify-between font-bold text-primary"><span>الشبكة (بنوك):</span> <span>{summary.networkTotal.toLocaleString('ar-EG')} ر.ي</span></div>
                  </CardContent>
               </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Landmark /> تفاصيل الشبكة حسب البنك</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <Table>
                        <TableHeader><TableRow>
                            <TableHead className="text-center">البنك</TableHead>
                            <TableHead className="text-center">إجمالي المبيعات</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {summary.networkByBank.length > 0 ? summary.networkByBank.map(([name, total]) => (
                                <TableRow key={name}>
                                    <TableCell className="text-center">{name}</TableCell>
                                    <TableCell className="text-center font-bold">{total.toLocaleString('ar-EG')} ر.ي</TableCell>
                                </TableRow>
                            )) : (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">لا توجد معاملات شبكة</TableCell>
                              </TableRow>
                            )}
                        </TableBody>
                    </Table>
                  </CardContent>
                </Card>
            </div>
             <div className="grid gap-4 md:grid-cols-2">
               <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Users /> أداء الكاشيرات</CardTitle>
                  </CardHeader>
                  <CardContent>
                       <Table>
                          <TableHeader><TableRow>
                              <TableHead className="text-center">الكاشير</TableHead>
                              <TableHead className="text-center">عدد الطلبات</TableHead>
                              <TableHead className="text-center">إجمالي المبيعات</TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                              {summary.cashierPerformance.map(([name, data]) => (
                                  <TableRow key={name}>
                                      <TableCell className="text-center">{name}</TableCell>
                                      <TableCell className="text-center">{data.orderCount}</TableCell>
                                      <TableCell className="text-center font-bold">{data.totalSales.toLocaleString('ar-EG')} ر.ي</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </CardContent>
               </Card>
               <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ShoppingBag /> الأصناف الأكثر مبيعًا</CardTitle>
                  </CardHeader>
                  <CardContent>
                       <Table>
                          <TableHeader><TableRow>
                              <TableHead className="text-center">الصنف</TableHead>
                              <TableHead className="text-center">الكمية المباعة</TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                              {summary.topSellingItems.map(([name, quantity]) => (
                                  <TableRow key={name}>
                                      <TableCell className="text-center">{name}</TableCell>
                                      <TableCell className="text-center">{quantity}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </CardContent>
               </Card>
            </div>
          </div>
          )}
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
