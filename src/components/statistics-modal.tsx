

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay, isValid, formatISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Calendar as CalendarIcon,
  Download,
  Printer,
  TrendingUp,
  Wallet,
  Loader2,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  PieChart,
  Pie,
  Cell,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { Order } from './orders-log-modal';
import type { Transaction } from './accounting-fund-modal';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateComprehensiveReportHtml } from '@/app/export/actions';
import { ScrollArea } from './ui/scroll-area';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatisticsModal({ isOpen, onClose }: StatisticsModalProps) {
  const { toast } = useToast();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [ordersRes, transRes, prodRes, settingsRes] = await Promise.all([
                    fetch('/api/orders'),
                    fetch('/api/transactions'),
                    fetch('/api/products'),
                    fetch('/api/settings')
                ]);

                if (!ordersRes.ok || !transRes.ok || !prodRes.ok) {
                    throw new Error("Failed to fetch all required data.");
                }

                const ordersData = await ordersRes.json();
                const transData = await transRes.json();
                
                if (settingsRes.ok) {
                  const settingsData = await settingsRes.json();
                  setLogo(settingsData.logo_base64 || null);
                }
                
                setOrders(ordersData);
                setTransactions(transData.map((t: any) => ({...t, amount: parseFloat(t.amount)})));
                setProducts(await prodRes.json());
                
            } catch (error) {
                toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات الإحصائيات.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }
  }, [isOpen, toast]);

  const filteredData = useMemo(() => {
    const fromDate = date?.from ? startOfDay(date.from) : undefined;
    const toDate = date?.to ? endOfDay(date.to) : undefined;
    
    const filterByDate = (itemDateStr: string) => {
        const itemDate = new Date(itemDateStr);
        if (!isValid(itemDate)) return false;
        if (!fromDate || !toDate) return true;
        return itemDate >= fromDate && itemDate <= toDate;
    }

    const filteredOrders = orders.filter(o => filterByDate(o.date));
    const filteredTransactions = transactions.filter(t => filterByDate(t.transaction_date.toString()));
    
    return { orders: filteredOrders, transactions: filteredTransactions };
  }, [date, orders, transactions]);

  const dailyPerformance = useMemo(() => {
    const performanceMap: { [key: string]: { sales: number; expenses: number; profit: number } } = {};
    if (!date?.from || !date?.to) return [];

    let currentDate = new Date(date.from);
    const endDate = new Date(date.to);

    while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        performanceMap[dateStr] = { sales: 0, expenses: 0, profit: 0 };
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    filteredData.transactions.forEach(transaction => {
        const dateStr = format(new Date(transaction.transaction_date), 'yyyy-MM-dd');
        if (performanceMap[dateStr]) {
            if (transaction.type === 'revenue' && transaction.classification === 'sales') {
                performanceMap[dateStr].sales += transaction.amount;
            } else if (transaction.type === 'expense') {
                performanceMap[dateStr].expenses += transaction.amount;
            }
        }
    });
    
    return Object.entries(performanceMap).map(([date, data]) => ({
        date,
        day: format(new Date(date), 'eeee', { locale: ar }),
        sales: data.sales,
        expenses: data.expenses,
        profit: data.sales - data.expenses,
    }));

  }, [filteredData, date]);


  const { totalSalesByCurrency, totalExpensesByCurrency, totalOrders } = useMemo(() => {
    const salesByCurrency = filteredData.transactions
      .filter(t => t.type === 'revenue' && t.classification === 'sales')
      .reduce((acc, curr) => {
        acc[curr.currency] = (acc[curr.currency] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

    const expensesByCurrency = filteredData.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.currency] = (acc[curr.currency] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);
      
    return {
      totalSalesByCurrency: salesByCurrency,
      totalExpensesByCurrency: expensesByCurrency,
      totalOrders: filteredData.orders.filter(o => o.status === 'نشط').length,
    };
  }, [filteredData]);

  const topProductsData = useMemo(() => {
     const itemCounts = filteredData.orders
        .filter(o => o.status === 'نشط')
        .flatMap(o => o.items)
        .reduce((acc, item) => {
            acc[item.name] = (acc[item.name] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);

    return Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([name, value]) => ({ name, value }));
  }, [filteredData.orders]);
  
  const handlePrintReport = async () => {
    toast({ title: 'جاري إنشاء التقرير...', description: 'قد تستغرق هذه العملية لحظات.' });
    try {
      const netProfitByCurrency = Object.keys(totalSalesByCurrency).reduce((acc, currency) => {
          acc[currency] = (totalSalesByCurrency[currency] || 0) - (totalExpensesByCurrency[currency] || 0);
          return acc;
      }, {} as Record<string, number>);

      const reportData = {
          metrics: { 
            totalSalesByCurrency, 
            totalExpensesByCurrency, 
            netProfitByCurrency, 
            totalOrders 
          },
          dailyPerformance,
          topProducts: topProductsData,
          orders: filteredData.orders,
          transactions: filteredData.transactions,
          products: products,
          logo: logo,
          // We will need to pass banks, currencies, branches and users too if we want a complete report
          banks: [],
          currencies: [],
          branches: [],
          users: [],
      };

      const reportHtml = await generateComprehensiveReportHtml(reportData as any);

      const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Comprehensive_Report_${format(new Date(), 'yyyy-MM-dd')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'تم إنشاء التقرير بنجاح!', description: 'تم تنزيل ملف HTML للتقرير.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'فشل إنشاء التقرير', description: 'حدث خطأ أثناء إنشاء التقرير.' });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-2xl flex items-center gap-2"><TrendingUp /> الإحصائيات والتقارير</DialogTitle>
        </DialogHeader>

        <div className="p-4 flex justify-between items-center bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))) : (<span>اختر نطاق التاريخ</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrintReport}><Printer className="ml-2"/> طباعة التقرير</Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
             <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
          ) : (
          <div className="p-4 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                    <Wallet className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    {Object.entries(totalSalesByCurrency).map(([currency, total]) => (
                        <div key={currency} className="text-2xl font-bold">{total.toLocaleString('en-US')} {currency}</div>
                    ))}
                    {Object.keys(totalSalesByCurrency).length === 0 && <div className="text-2xl font-bold">0 ر.ي</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                    <Briefcase className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                     {Object.entries(totalExpensesByCurrency).map(([currency, total]) => (
                        <div key={currency} className="text-2xl font-bold">{total.toLocaleString('en-US')} {currency}</div>
                    ))}
                    {Object.keys(totalExpensesByCurrency).length === 0 && <div className="text-2xl font-bold">0 ر.ي</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">عدد الطلبات</CardTitle>
                  <BarChart2 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{totalOrders.toLocaleString('ar-EG')}</div>
                   <p className="text-xs text-green-500 flex items-center"><ArrowUp className="h-4 w-4" /> +180 من الشهر الماضي</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>نظرة عامة على الأداء</CardTitle>
                  <CardDescription>المبيعات مقابل المصروفات للفترة المحددة</CardDescription>
                </CardHeader>
                <CardContent className="pl-2 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={dailyPerformance}>
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', direction: 'rtl' }} formatter={(value:number, name) => [`${value.toLocaleString('ar-EG')} ر.ي`, name === 'sales' ? 'المبيعات' : 'المصروفات']}/>
                      <Legend wrapperStyle={{direction: "rtl"}} formatter={(value) => value === 'sales' ? 'المبيعات' : 'المصروفات'} />
                      <RechartsBar dataKey="sales" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="المبيعات"/>
                      <RechartsBar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="المصروفات" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
               <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>الأصناف الأكثر مبيعًا</CardTitle>
                  <CardDescription>توزيع المبيعات على الأصناف الأعلى.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                      <Pie data={topProductsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {topProductsData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                       <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', direction: 'rtl' }} formatter={(value:number) => [`${value} طلب`, "عدد الطلبات"]}/>
                      <Legend wrapperStyle={{direction: "rtl"}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            <Card>
                 <CardHeader><CardTitle>تقرير الأداء التفصيلي</CardTitle></CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow className="hover:bg-muted/50 bg-primary">
                            <TableHead className="text-primary-foreground text-center">التاريخ</TableHead>
                            <TableHead className="text-primary-foreground text-center">اليوم</TableHead>
                            <TableHead className="text-primary-foreground text-center">المبيعات</TableHead>
                            <TableHead className="text-primary-foreground text-center">المصروفات</TableHead>
                            <TableHead className="text-primary-foreground text-center">صافي الربح</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {dailyPerformance.map(d => (
                                <TableRow key={d.date}>
                                    <TableCell className="text-center">{d.date}</TableCell>
                                    <TableCell className="text-center">{d.day}</TableCell>
                                    <TableCell className="text-green-500 text-center">{d.sales.toLocaleString('en-US')} ر.ي</TableCell>
                                    <TableCell className="text-red-500 text-center">{d.expenses.toLocaleString('en-US')} ر.ي</TableCell>
                                    <TableCell className={cn("font-bold text-center", d.profit >= 0 ? "text-green-500" : "text-red-500")}>{d.profit.toLocaleString('en-US')} ر.ي</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </div>
          )}
        </ScrollArea>
        <DialogFooter className="p-4 border-t"><Button variant="secondary" onClick={onClose}>إغلاق</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
