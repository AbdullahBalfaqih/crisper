'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast.tsx';
import { format } from 'date-fns';
import { FileDown, Loader2 } from 'lucide-react';
import { generateComplaintsHtmlReport } from '@/app/export/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ComplaintsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type User = {
    id: string;
    full_name: string;
};

type Complaint = { 
  id: number; 
  customer_name: string;
  user_id: string | null;
  date: Date; 
  subject: string; 
  description: string; 
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
};

type FormState = Partial<Omit<Complaint, 'id' | 'date'>>;
type Status = 'new' | 'in_progress' | 'resolved' | 'closed';

const statusTranslations: Record<Status, string> = {
    new: 'جديدة',
    in_progress: 'قيد المراجعة',
    resolved: 'تم الحل',
    closed: 'مغلقة'
};

export function ComplaintsModal({ isOpen, onClose }: ComplaintsModalProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [formState, setFormState] = useState<FormState>({});
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
        const [complaintsRes, usersRes] = await Promise.all([
            fetch('/api/complaints'),
            fetch('/api/users')
        ]);

        if (!complaintsRes.ok || !usersRes.ok) throw new Error('Failed to fetch data');
        
        const complaintsData = await complaintsRes.json();
        const usersData = await usersRes.json();

        setComplaints(complaintsData.map((c: any) => ({ ...c, date: new Date(c.created_at) })));
        setUsers(usersData);

    } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة الشكاوى.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);


  useEffect(() => {
    if (isOpen) {
      fetchComplaints();
    }
  }, [isOpen, fetchComplaints]);

  useEffect(() => {
    if (selectedComplaint) {
      setFormState({
        customer_name: selectedComplaint.customer_name,
        subject: selectedComplaint.subject,
        description: selectedComplaint.description,
        user_id: selectedComplaint.user_id,
      });
    } else {
      resetForm();
    }
  }, [selectedComplaint]);

  const resetForm = () => {
    setFormState({ customer_name: '', subject: '', description: '', user_id: null });
    setSelectedComplaint(null);
  };
  
  const handleInputChange = (field: keyof FormState, value: string | null) => {
    setFormState(prev => ({...prev, [field]: value}));
  };

  const handleSave = async () => {
    if (!formState.customer_name || !formState.subject || !formState.description) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع حقول الشكوى.' });
      return;
    }
    
    setIsLoading(true);
    const isEditing = !!selectedComplaint;
    const url = isEditing ? `/api/complaints/${selectedComplaint.id}` : '/api/complaints';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formState)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save complaint');
        }
        toast({ title: 'تم الحفظ', description: `تم ${isEditing ? 'تعديل' : 'تسجيل'} الشكوى بنجاح.` });
        resetForm();
        await fetchComplaints();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ في الحفظ', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Status) => {
    if (!selectedComplaint) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد شكوى لتحديث حالتها.' });
      return;
    }
    
    setIsLoading(true);
     try {
        const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) throw new Error('Failed to update status');
        
        toast({ title: 'تم تحديث الحالة', description: `تم تحديث حالة الشكوى إلى ${statusTranslations[newStatus]}.` });
        await fetchComplaints();

    } catch(e) {
         toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث حالة الشكوى.' });
    } finally {
        setIsLoading(false);
    }
  };
  
  const getStatusVariant = (status: Status) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      default: return 'outline';
    }
  }

  const handleExport = async () => {
    toast({ title: 'جاري إنشاء التقرير...', description: 'يتم تجهيز تقرير HTML بالشكاوى الحالية.' });
    try {
      const reportData = complaints.map(c => ({...c, customer: c.customer_name}));
      const reportHtml = await generateComplaintsHtmlReport(reportData);
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'complaints-report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل تقرير الشكاوى.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          <DialogHeader className="p-4 bg-primary text-primary-foreground">
            <DialogTitle className="text-2xl">إدارة الشكاوى</DialogTitle>
            <DialogDescription className="text-primary-foreground/90">تسجيل ومتابعة شكاوى العملاء لتحسين الخدمة.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 grid md:grid-cols-3 gap-6 pt-4 overflow-y-auto">
            {/* Form Panel */}
            <div className="md:col-span-1 flex flex-col gap-6">
              <div className="bg-card p-6 rounded-lg border flex-1 flex flex-col">
                <h3 className="text-lg font-semibold mb-4">{selectedComplaint ? 'عرض/تعديل شكوى' : 'تسجيل شكوى جديدة'}</h3>
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <Label htmlFor="comp-customer">اسم العميل</Label>
                    <Select value={formState.user_id || ''} onValueChange={(val) => {
                        const selected = users.find(u => u.id === val);
                        handleInputChange('user_id', val);
                        handleInputChange('customer_name', selected ? selected.full_name : null);
                    }}>
                        <SelectTrigger id="comp-customer"><SelectValue placeholder="اختر عميلاً..."/></SelectTrigger>
                        <SelectContent>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-1">
                    <Label htmlFor="comp-subject">موضوع الشكوى</Label>
                    <Input id="comp-subject" value={formState.subject || ''} onChange={e => handleInputChange('subject', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="comp-description">تفاصيل الشكوى</Label>
                    <Textarea id="comp-description" value={formState.description || ''} onChange={e => handleInputChange('description', e.target.value)} rows={5}/>
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full mt-4">{selectedComplaint ? 'حفظ التعديلات' : 'إضافة شكوى'}</Button>
              </div>
            </div>

            {/* Table Panel */}
            <div className="md:col-span-2 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                  <span className="font-semibold">تغيير الحالة:</span>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('in_progress')} disabled={!selectedComplaint}>قيد المراجعة</Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('resolved')} disabled={!selectedComplaint}>تم الحل</Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('closed')} disabled={!selectedComplaint}>إغلاق</Button>
                  <Button size="sm" variant="secondary" onClick={resetForm} className="mr-auto">شكوى جديدة</Button>
                  <Button size="sm" variant="outline" onClick={handleExport}><FileDown className="ml-2"/>تصدير</Button>
              </div>
              <div className="flex-1 rounded-lg overflow-hidden border">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary hover:bg-primary/90">
                        <TableHead className="text-primary-foreground text-center">#</TableHead>
                        <TableHead className="text-primary-foreground text-center">العميل</TableHead>
                        <TableHead className="text-primary-foreground text-center">التاريخ</TableHead>
                        <TableHead className="text-primary-foreground text-center">الموضوع</TableHead>
                        <TableHead className="text-primary-foreground text-center">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complaints.map((c) => (
                        <TableRow
                          key={c.id}
                          onClick={() => setSelectedComplaint(c)}
                          className={cn('cursor-pointer', selectedComplaint?.id === c.id && 'bg-muted')}
                        >
                          <TableCell className="text-center">{c.id}</TableCell>
                          <TableCell className="text-center">{c.customer_name}</TableCell>
                          <TableCell className="text-center">{format(c.date, "yyyy/MM/dd")}</TableCell>
                          <TableCell className="text-center">{c.subject}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getStatusVariant(c.status as Status)}>{statusTranslations[c.status]}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={onClose}>رجوع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
