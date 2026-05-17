'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign, Activity, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { SidebarTrigger } from './ui/sidebar';

interface DashboardData {
    totalRevenue: number;
    revenueChange: number | null;
    newCustomers: number;
    customersChange: number | null;
    totalSales: number;
    salesChange: number | null;
    activeNow: number;
    dailySales: { date: string; sales: number }[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error(error);
        // You might want to set some error state here
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !data) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">جاري تحميل بيانات لوحة التحكم...</p>
            </div>
      </div>
    );
  }

  const formatPercentage = (value: number | null) => {
    if (value === null || typeof value === 'undefined') return '0.0%';
    if (value === Infinity) return '+∞%';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toLocaleString('ar-SA', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }
  
  const chartData = data.dailySales.map(d => ({
      name: new Date(d.date).toLocaleDateString('ar-SA', { weekday: 'short'}),
      sales: d.sales
  }));

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">لوحة التحكم</h2>
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.totalRevenue.toLocaleString('ar-SA')} ر.ي</div>
                    <p className="text-xs text-muted-foreground">{formatPercentage(data.revenueChange)} من الشهر الماضي</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">العملاء الجدد</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{data.newCustomers}</div>
                    <p className="text-xs text-muted-foreground">{formatPercentage(data.customersChange)} من الشهر الماضي</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المبيعات</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{data.totalSales}</div>
                    <p className="text-xs text-muted-foreground">{formatPercentage(data.salesChange)} من الشهر الماضي</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">النشاط الحالي</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{data.activeNow}</div>
                    <p className="text-xs text-muted-foreground">طلب في الساعة الماضية</p>
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>نظرة عامة على المبيعات</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                   <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`}/>
                            <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--background))",
                                  borderColor: "hsl(var(--border))",
                                  direction: "rtl"
                                }}
                                formatter={(value: number) => [`${value.toLocaleString('ar-SA')} ر.ي`, "المبيعات"]}
                            />
                            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                   </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>حركة المرور</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
                        <p>سيتم عرض مخطط حركة المرور هنا.</p>
                   </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
