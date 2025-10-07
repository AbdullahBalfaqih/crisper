'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateSalesReport } from '@/ai/flows/generate-sales-report';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast.tsx';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface SalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  dailySales: z.string().min(1, 'المبيعات اليومية مطلوبة.'),
  topSellingItems: z.string().min(1, 'المنتجات الأكثر مبيعًا مطلوبة.'),
  employeeHours: z.string().min(1, 'ساعات عمل الموظفين مطلوبة.'),
});

type FormValues = z.infer<typeof formSchema>;

const exampleChartData = [
    { name: 'تشيز برجر', sales: 1200 },
    { name: 'سلطة دجاج', sales: 900 },
    { name: 'سباغيتي', sales: 1100 },
    { name: 'شاي مثلج', sales: 1500 },
    { name: 'قهوة', sales: 1800 },
];

export function SalesReportModal({ isOpen, onClose }: SalesReportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dailySales: '',
      topSellingItems: '',
      employeeHours: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async data => {
    setIsLoading(true);
    setReport(null);
    try {
      const result = await generateSalesReport(data);
      setReport(result.summary);
      toast({
        title: 'تم إنشاء التقرير',
        description: 'ملخص تقرير المبيعات جاهز.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل إنشاء تقرير المبيعات. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>إنشاء تقرير المبيعات</DialogTitle>
          <DialogDescription>
            أدخل البيانات اليومية لإنشاء ملخص وتحليل مدعوم بالذكاء الاصطناعي.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 h-full overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex flex-col">
              <FormField
                control={form.control}
                name="dailySales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبيعات اليومية ($)</FormLabel>
                    <FormControl>
                      <Input placeholder="على سبيل المثال، 5,430.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="topSellingItems"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المنتجات الأكثر مبيعًا</FormLabel>
                    <FormControl>
                      <Textarea placeholder="على سبيل المثال، قهوة (120 وحدة)، شاي مثلج (95 وحدة)، تشيز برجر (80 وحدة)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employeeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ساعات عمل الموظفين</FormLabel>
                    <FormControl>
                      <Textarea placeholder="على سبيل المثال، جون د. (8 ساعات)، جين س. (6.5 ساعات)، مايك ر. (8 ساعات)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <DialogFooter className="!mt-auto pt-4">
                 <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  إنشاء التقرير
                </Button>
               </DialogFooter>
            </form>
          </Form>

          <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>التقرير والتحليل</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto">
              {isLoading && (
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
              )}
              {report && (
                <div className="prose prose-sm max-w-none text-right">
                    <p>{report}</p>
                </div>
              )}
              {!isLoading && !report && (
                 <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <p>سيظهر تقريرك الذي تم إنشاؤه وتصور البيانات هنا.</p>
                 </div>
              )}
              {report && (
                <div className="w-full h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exampleChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
