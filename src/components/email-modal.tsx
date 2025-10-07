'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail, Users, MailCheck, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Customer = { 
  id: string; 
  full_name: string;
  email: string | null;
};

type SendingStatus = 'idle' | 'sending' | 'sent';

export function EmailModal({ isOpen, onClose }: EmailModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('مرحباً [اسم العميل]، نود أن نقدم لك...');
  const [sendingStatus, setSendingStatus] = useState<SendingStatus>('idle');
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('/api/users');
                if (!response.ok) throw new Error('Failed to fetch users');
                const allUsers: any[] = await response.json();
                const customerUsers = allUsers.filter(user => user.role === 'customer' && user.email);
                setCustomers(customerUsers);
            } catch (error) {
                toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة العملاء.' });
            }
        };
        fetchCustomers();
    } else {
        // Reset state on close
        setSubject('');
        setMessage('مرحباً [اسم العميل]، نود أن نقدم لك...');
        setSelectedCustomerIds(new Set());
        setSendingStatus('idle');
    }
  }, [isOpen, toast]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(new Set(customers.map(c => c.id)));
    } else {
      setSelectedCustomerIds(new Set());
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    const newSet = new Set(selectedCustomerIds);
    if (checked) {
      newSet.add(customerId);
    } else {
      newSet.delete(customerId);
    }
    setSelectedCustomerIds(newSet);
  };

  const handleSendEmail = async () => {
    if (selectedCustomerIds.size === 0 || !subject || !message) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى اختيار عميل واحد على الأقل وملء الموضوع ونص الرسالة.',
      });
      return;
    }
    
    setSendingStatus('sending');
    
    const selectedCustomersData = customers.filter(c => selectedCustomerIds.has(c.id));
    const recipientEmails = selectedCustomersData.map(c => c.email).filter((email): email is string => email !== null);
    const recipientNames = selectedCustomersData.map(c => c.full_name);

    try {
        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientEmails, recipientNames, subject, message }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'فشل إرسال البريد الإلكتروني');
        }
        
        setSendingStatus('sent');
        toast({
          title: 'تم إرسال البريد بنجاح',
          description: `تم إرسال رسالتك إلى ${selectedCustomerIds.size} عملاء.`,
        });

        setTimeout(() => {
            setSendingStatus('idle');
            setSelectedCustomerIds(new Set());
            setSubject('');
            setMessage('مرحباً [اسم العميل]، نود أن نقدم لك...');
        }, 2000);

    } catch (error: any) {
        setSendingStatus('idle');
        toast({ variant: 'destructive', title: 'خطأ في الإرسال', description: error.message });
    }
  };

  const getButtonContent = () => {
      switch (sendingStatus) {
          case 'sending':
              return (
                  <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                  </>
              );
          case 'sent':
              return (
                  <>
                      <Check className="ml-2 h-4 w-4" />
                      تم الإرسال
                  </>
              );
          default:
              return (
                  <>
                      <Send className="ml-2 h-4 w-4" />
                      إرسال
                  </>
              );
      }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-2xl flex items-center gap-2"><Mail /> إرسال بريد إلكتروني</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 grid md:grid-cols-2 gap-6 p-6 overflow-y-auto">
          {/* Email Form */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send /> إنشاء رسالة جديدة</CardTitle>
              <CardDescription>اختر العملاء واكتب رسالتك لإرسالها.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label>إلى:</Label>
                <div className="flex items-center gap-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                   <Users className="h-4 w-4 text-muted-foreground" />
                   <span>{selectedCustomerIds.size > 0 ? `${selectedCustomerIds.size} عملاء محددون` : 'لم يتم تحديد أي عميل'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">الموضوع:</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="على سبيل المثال: عرض خاص لك!"
                />
              </div>
              <div className="space-y-2 flex-1 flex flex-col">
                <Label htmlFor="email-message">نص الرسالة:</Label>
                <Textarea
                  id="email-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="مرحباً [اسم العميل]، نود أن نقدم لك..."
                  className="flex-1"
                />
              </div>
            </CardContent>
            <DialogFooter className="p-4 border-t">
              <Button 
                onClick={handleSendEmail} 
                className={cn(
                    "w-full bg-green-600 hover:bg-green-700 text-white",
                    sendingStatus === 'sent' && 'bg-blue-600 hover:bg-blue-700'
                )}
                disabled={sendingStatus !== 'idle'}
              >
                {getButtonContent()}
              </Button>
            </DialogFooter>
          </Card>

          {/* Customer List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2"><Users /> قائمة العملاء</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleSelectAll(selectedCustomerIds.size < customers.length)}>
                  <MailCheck className="ml-2 h-4 w-4"/>
                  {selectedCustomerIds.size < customers.length ? 'تحديد الكل' : 'إلغاء تحديد الكل'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow
                        key={customer.id}
                      >
                        <TableCell>
                           <Checkbox
                            checked={selectedCustomerIds.has(customer.id)}
                            onCheckedChange={(checked) => handleSelectCustomer(customer.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>{customer.full_name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="p-4 border-t">
          <Button variant="secondary" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}