'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Users, UserSearch, MessageSquare, BadgeInfo, Trash2, Edit, PlusCircle, FileDown, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { generateCustomersHtmlReport } from '@/app/export/actions';


interface CustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Customer = { id: string; name: string; username: string; phone: string; email: string; totalOrders: number; totalSpent: number; };
type FormState = Partial<Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'username'>> & { password?: string };

export function CustomersModal({ isOpen, onClose }: CustomersModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [formState, setFormState] = useState<FormState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('مرحباً [اسم العميل]، لدينا عرض خاص لك!');
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
      setIsLoading(true);
      try {
          const response = await fetch('/api/customers');
          if (!response.ok) throw new Error('Failed to fetch customers');
          setCustomers(await response.json());
      } catch (error) {
          toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات العملاء.'});
      } finally {
          setIsLoading(false);
      }
  }, [toast]);
  
  useEffect(() => {
    if (isOpen) {
        fetchCustomers();
    }
  }, [isOpen, fetchCustomers]);
  
  useEffect(() => {
    if (activeCustomer) {
        setFormState({name: activeCustomer.name, phone: activeCustomer.phone, email: activeCustomer.email});
    } else {
        resetForm();
    }
  }, [activeCustomer]);

  const filteredCustomers = useMemo(() => 
    customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ), 
    [searchQuery, customers]
  );
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    const newSet = new Set(selectedCustomers);
    if (checked) {
      newSet.add(customerId);
    } else {
      newSet.delete(customerId);
    }
    setSelectedCustomers(newSet);
  };
  
  const handleRowClick = (customer: Customer) => {
      setActiveCustomer(customer);
  };
  
  const resetForm = () => {
      setActiveCustomer(null);
      setFormState({name: '', phone: '', email: '', password: ''});
  };
  
  const handleSave = async () => {
    if (!formState.name || !formState.phone) {
        toast({variant: 'destructive', title: 'خطأ', description: 'اسم العميل ورقم الهاتف مطلوبان.'});
        return;
    }
    
    const isEditing = !!activeCustomer;
    const url = isEditing ? `/api/users/${activeCustomer.id}` : '/api/users';
    const method = isEditing ? 'PUT' : 'POST';

    const payload = isEditing ? {
        full_name: formState.name,
        phone_number: formState.phone,
        email: formState.email,
        role: 'customer',
        username: activeCustomer.username, // Username cannot be changed
    } : {
        full_name: formState.name,
        username: formState.name?.replace(/\s+/g, '_').toLowerCase() + Date.now().toString().slice(-4), // Auto-generate username
        phone_number: formState.phone,
        email: formState.email,
        password: formState.password || '123456', // Set default password
        role: 'customer'
    };

    setIsLoading(true);
    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'فشل حفظ العميل');
        }
        toast({title: "تم بنجاح", description: `تم ${isEditing ? 'تحديث' : 'إضافة'} العميل.`});
        await fetchCustomers();
        resetForm();
    } catch(e: any) {
        toast({variant: 'destructive', title: 'خطأ في الحفظ', description: e.message});
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
      if(!activeCustomer) return;
      setIsLoading(true);
      try {
          const response = await fetch(`/api/users/${activeCustomer.id}`, { method: 'DELETE' });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to delete customer');
          }
          toast({title: "تم الحذف", description: `تم حذف العميل ${activeCustomer.name}.`});
          await fetchCustomers();
          resetForm();
      } catch (e: any) {
          toast({variant: 'destructive', title: 'خطأ في الحذف', description: e.message});
      } finally {
          setIsLoading(false);
          setIsAlertOpen(false);
      }
  }


  const handleSendWhatsApp = () => {
    if (selectedCustomers.size === 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى اختيار عميل واحد على الأقل.' });
      return;
    }
    if (!message) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن إرسال رسالة فارغة.' });
      return;
    }
    
    let count = 0;
    customers.forEach(customer => {
      if (selectedCustomers.has(customer.id)) {
        const personalizedMessage = message.replace(/\[اسم العميل\]/g, customer.name);
        const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(personalizedMessage)}`;
        window.open(whatsappUrl, '_blank');
        count++;
      }
    });

    toast({
      title: 'تم فتح واتساب',
      description: `جاري تجهيز الرسائل لـ ${count} عملاء.`,
    });
  };

  const handleExport = async () => {
    toast({ title: 'جاري إنشاء التقرير...', description: 'يتم تجهيز تقرير HTML بالعملاء الحاليين.' });
    try {
      const reportHtml = await generateCustomersHtmlReport(filteredCustomers);
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers-report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل تقرير العملاء.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        <DialogHeader className="p-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-2xl flex items-center gap-2"><Users /> إدارة العملاء</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="grid md:grid-cols-12 gap-6 p-6 py-4 bg-muted/40">
            {/* Customers List & Messaging */}
            <div className="md:col-span-8 flex flex-col gap-4">
                <Card className="bg-card flex-1 flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2"><UserSearch /> قائمة العملاء ({filteredCustomers.length})</CardTitle>
                            <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={handleExport}><FileDown className="ml-2"/> تصدير</Button>
                            </div>
                        </div>
                        <div className="relative pt-4">
                            <Input 
                                placeholder="ابحث بالاسم، الرقم، أو البريد الإلكتروني..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-primary">
                                        <TableHead className="w-12 text-primary-foreground text-center">
                                            <Checkbox
                                                checked={selectedCustomers.size > 0 && selectedCustomers.size === filteredCustomers.length}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="text-primary-foreground text-center">الاسم</TableHead>
                                        <TableHead className="text-primary-foreground text-center">رقم الجوال</TableHead>
                                        <TableHead className="text-primary-foreground text-center">إجمالي الطلبات</TableHead>
                                        <TableHead className="text-primary-foreground text-center">إجمالي الصرف</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomers.map((customer) => (
                                    <TableRow 
                                        key={customer.id} 
                                        className={cn("cursor-pointer", activeCustomer?.id === customer.id && "bg-primary/20")}
                                        onClick={() => handleRowClick(customer)}
                                    >
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={selectedCustomers.has(customer.id)}
                                                onCheckedChange={(checked) => handleSelectCustomer(customer.id, !!checked)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">{customer.name}</TableCell>
                                        <TableCell className="text-center">{customer.phone}</TableCell>
                                        <TableCell className="text-center">{customer.totalOrders}</TableCell>
                                        <TableCell className="text-center">{customer.totalSpent.toFixed(2)} ر.ي</TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Form and Messaging Panel */}
            <div className="md:col-span-4 flex flex-col gap-4">
                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">{activeCustomer ? <Edit/> : <PlusCircle />} {activeCustomer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1"><Label>اسم العميل</Label><Input value={formState.name || ''} onChange={e => setFormState(p => ({...p, name: e.target.value}))}/></div>
                        <div className="space-y-1"><Label>رقم الجوال</Label><Input value={formState.phone || ''} onChange={e => setFormState(p => ({...p, phone: e.target.value}))}/></div>
                        <div className="space-y-1"><Label>البريد الإلكتروني</Label><Input type="email" value={formState.email || ''} onChange={e => setFormState(p => ({...p, email: e.target.value}))}/></div>
                        {!activeCustomer && <div className="space-y-1"><Label>كلمة المرور (افتراضي: 123456)</Label><Input type="password" value={formState.password || ''} onChange={e => setFormState(p => ({...p, password: e.target.value}))}/></div>}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={resetForm}>إلغاء</Button>
                        <div className="flex gap-2">
                            {activeCustomer && <Button variant="destructive" onClick={() => setIsAlertOpen(true)}>حذف</Button>}
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}><Save className="ml-2"/> حفظ</Button>
                        </div>
                    </CardFooter>
                </Card>
                <Card className="bg-card flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageSquare /> إرسال رسالة واتساب</CardTitle>
                        <CardDescription>
                            أرسل رسائل مخصصة لعملائك المحددين ({selectedCustomers.size} عملاء).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                        <div className="space-y-2 flex-1 flex flex-col">
                            <Label htmlFor="whatsapp-message">نص الرسالة</Label>
                            <Textarea
                                id="whatsapp-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="اكتب رسالتك هنا..."
                                className="flex-1"
                                rows={5}
                            />
                        </div>
                        <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground flex items-start gap-2">
                            <BadgeInfo className="h-4 w-4 shrink-0 mt-0.5"/>
                            <span>
                                استخدم <code className="bg-background p-1 rounded-sm text-primary">[اسم العميل]</code> ليتم استبداله باسم كل عميل.
                            </span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSendWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white">
                            <Send className="ml-2"/>
                            إرسال رسالة واتساب
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 bg-card border-t">
          <Button variant="ghost" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                    <AlertDialogDescription>
                        هل أنت متأكد أنك تريد حذف العميل {activeCustomer?.name}؟ لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </Dialog>
  );
}
