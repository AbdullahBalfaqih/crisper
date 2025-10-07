'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, PlusCircle, Trash2, TrendingUp, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PeakHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PeakHour = { id: number; day: string; hour_range: string; orders: number; };
type FormState = Partial<Omit<PeakHour, 'id'>>;

const daysOfWeek = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export function PeakHoursModal({ isOpen, onClose }: PeakHoursModalProps) {
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [selectedHour, setSelectedHour] = useState<PeakHour | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>({ day: '', hour_range: '', orders: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPeakHours = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/peak-hours');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setPeakHours(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات ساعات الذروة.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPeakHours();
    }
  }, [isOpen]);

  const { currentDayName, tomorrowDayName, currentHour24 } = useMemo(() => {
    const now = new Date();
    return {
      currentDayName: format(now, 'eeee', { locale: ar }),
      tomorrowDayName: format(addDays(now, 1), 'eeee', { locale: ar }),
      currentHour24: now.getHours()
    };
  }, []);

  const { currentStatus, upcomingPeakAlert } = useMemo(() => {
    let status = { text: 'الوقت الحالي هادئ', icon: Check, color: 'text-green-500' };
    let alert = null;
    
    // Check current status
    const currentDayPeaks = peakHours.filter(p => p.day === currentDayName);
    for (const peak of currentDayPeaks) {
        const [start, end] = peak.hour_range.match(/(\d{1,2})/g) || [];
        const startHour = parseInt(start, 10) + (peak.hour_range.includes('م') && parseInt(start, 10) !== 12 ? 12 : 0);
        const endHour = parseInt(end, 10) + (peak.hour_range.includes('م') && parseInt(end, 10) !== 12 ? 12 : 0);
        if (currentHour24 >= startHour && currentHour24 < endHour) {
            status = { text: 'الوقت الحالي هو وقت ذروة', icon: AlertTriangle, color: 'text-orange-500' };
            break;
        }
    }
    
    // Check for upcoming peak tomorrow
    const tomorrowPeak = peakHours.find(p => p.day === tomorrowDayName);
    if(tomorrowPeak) {
        alert = `تنبيه: توجد ذروة مسجلة ليوم غد (${tomorrowDayName}) من ${tomorrowPeak.hour_range}.`;
    }

    return { currentStatus: status, upcomingPeakAlert: alert };
  }, [peakHours, currentDayName, tomorrowDayName, currentHour24]);

  const handleInputChange = (field: keyof FormState, value: string | number) => {
    setFormState(prev => ({ 
        ...prev, 
        [field]: field === 'orders' ? Number(value) : value 
    }));
  };

  const handleDeleteClick = () => {
    if (!selectedHour) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى تحديد وقت ذروة لحذفه.',
      });
      return;
    }
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedHour) return;
    try {
        const response = await fetch(`/api/peak-hours/${selectedHour.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete peak hour');
        
        setPeakHours((prev) => prev.filter((h) => h.id !== selectedHour.id));
        toast({ title: 'تم الحذف', description: 'تم حذف وقت الذروة المحدد.' });
        setSelectedHour(null);
    } catch(error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف وقت الذروة.' });
    } finally {
        setIsAlertOpen(false);
    }
  };
  
  const handleAddClick = async () => {
    if (!formState.day || !formState.hour_range || formState.orders === undefined || formState.orders <= 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع الحقول بشكل صحيح.' });
      return;
    }
    
    try {
        const response = await fetch('/api/peak-hours', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                day: formState.day,
                hour_range: formState.hour_range,
                orders: formState.orders,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add peak hour');
        }
        
        const newPeakHour = await response.json();
        setPeakHours(prev => [...prev, newPeakHour].sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day)));
        toast({ title: 'تمت الإضافة', description: `تم تحديد وقت ذروة جديد ليوم ${formState.day}.` });
        setFormState({ day: '', hour_range: '', orders: 0 });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message || 'فشل إضافة وقت الذروة.' });
    }
  };

  const chartData = useMemo(() => {
    const dayToDisplay = selectedHour?.day || currentDayName;
    return peakHours
        .filter(p => p.day === dayToDisplay)
        .map(p => ({ hour: p.hour_range, 'عدد الطلبات': p.orders }));
  }, [peakHours, selectedHour, currentDayName]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 bg-primary text-primary-foreground">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <TrendingUp />
              تحليل ساعات الذروة
            </DialogTitle>
          </DialogHeader>

          <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-hidden">
            {/* Left Panel: Actions & Chart */}
            <div className="md:col-span-1 flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>الإجراءات</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="peak-day">اختر اليوم</Label>
                      <Select value={formState.day} onValueChange={(val) => handleInputChange('day', val)}>
                        <SelectTrigger id="peak-day"><SelectValue placeholder="اختر يوم..." /></SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="peak-hour">نطاق الساعة</Label>
                      <Input id="peak-hour" placeholder="مثال: 08:00م - 10:00م" value={formState.hour_range || ''} onChange={e => handleInputChange('hour_range', e.target.value)}/>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="peak-orders">عدد الطلبات المتوقعة</Label>
                      <Input id="peak-orders" type="number" placeholder="مثال: 75" value={formState.orders || ''} onChange={e => handleInputChange('orders', e.target.value)}/>
                    </div>

                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-lg" onClick={handleAddClick}>
                    <PlusCircle className="ml-2" />
                    إضافة الوقت
                  </Button>
                  <Button variant="destructive" className="w-full h-12 text-lg" onClick={handleDeleteClick} disabled={!selectedHour}>
                    <Trash2 className="ml-2" />
                    حذف الوقت المحدد
                  </Button>
                </CardContent>
              </Card>
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>مخطط طلبات {selectedHour?.day || 'اليوم الحالي'}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                      <XAxis
                        dataKey="hour"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--card-foreground))",
                          direction: "rtl"
                        }}
                        cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
                        labelStyle={{ marginBottom: "0.5rem" }}
                      />
                      <Bar dataKey="عدد الطلبات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel: Table */}
            <div className="md:col-span-2 p-4 flex flex-col h-full bg-card border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">الأوقات المسجلة</h3>
              <div className="flex-1 rounded-md border overflow-hidden relative">
                {isLoading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-muted/50 bg-primary">
                        <TableHead className="font-bold text-primary-foreground text-center">اليوم</TableHead>
                        <TableHead className="font-bold text-primary-foreground text-center">الساعة</TableHead>
                        <TableHead className="font-bold text-primary-foreground text-center">عدد الطلبات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {peakHours.map((hour) => (
                        <TableRow
                          key={hour.id}
                          onClick={() => setSelectedHour(hour)}
                          className={cn(
                            'cursor-pointer',
                            selectedHour?.id === hour.id && 'bg-primary/20',
                            hour.day === currentDayName && selectedHour?.id !== hour.id && 'bg-yellow-400/20 hover:bg-yellow-400/30'
                          )}
                        >
                          <TableCell className="text-center">{hour.day}</TableCell>
                          <TableCell className="text-center">{hour.hour_range}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{hour.orders}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </main>

          <DialogFooter className="p-4 border-t flex justify-between items-center">
            <div className="flex items-center gap-4">
              {upcomingPeakAlert && (
                  <p className="text-lg flex items-center gap-2 font-semibold text-destructive">
                    <AlertTriangle/>
                    {upcomingPeakAlert}
                  </p>
              )}
            </div>
            <div className={cn("flex items-center gap-2 font-semibold", currentStatus.color)}>
              <currentStatus.icon />
              <span>{currentStatus.text}</span>
            </div>
            <Button variant="secondary" className="h-12 px-8" onClick={onClose}>رجوع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد حذف وقت الذروة المحدد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
