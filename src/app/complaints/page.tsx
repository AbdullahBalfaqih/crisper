'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquareWarning, Send, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ComplaintsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [complaintCount, setComplaintCount] = useState(0);
  const MAX_COMPLAINTS = 3;

  const fetchComplaintCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/complaints?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setComplaintCount(data.length);
      }
    } catch (error) {
      console.error("Failed to fetch complaint count", error);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchComplaintCount();
    } else if (!authLoading && !user) {
      toast({
        title: 'الوصول غير مسموح',
        description: 'يجب عليك تسجيل الدخول لتقديم شكوى.',
        variant: 'destructive'
      });
      router.push('/login');
    }
  }, [user, authLoading, toast, router, fetchComplaintCount]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى ملء حقلي الموضوع والرسالة.',
      });
      return;
    }

    if (complaintCount >= MAX_COMPLAINTS) {
      toast({
        variant: 'destructive',
        title: 'لقد وصلت للحد الأقصى',
        description: 'لقد وصلت إلى الحد الأقصى لعدد الشكاوى المسموح به.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          customer_name: user?.full_name,
          subject,
          description: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل إرسال الشكوى.');
      }
      
      toast({
        title: 'تم الإرسال بنجاح',
        description: 'شكراً لك، تم استلام شكواك وسنعمل عليها في أقرب وقت.',
      });

      setSubject('');
      setMessage('');
      fetchComplaintCount(); // Re-fetch the count

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const remainingComplaints = MAX_COMPLAINTS - complaintCount;
  const canSubmit = remainingComplaints > 0;

  return (
    <div className="bg-background min-h-screen font-body text-foreground pb-20">
      <div className="container mx-auto max-w-lg p-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/account" className="p-2">
            <ArrowRight size={24} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            الشكاوى والاقتراحات
            <MessageSquareWarning />
          </h1>
          <div className="w-8"></div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">لديك {remainingComplaints} شكاوى متبقية.</p>
                <p className="text-xs">لكل عميل الحق في تقديم {MAX_COMPLAINTS} شكاوى كحد أقصى.</p>
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="subject">الموضوع</Label>
                <Input id="subject" placeholder="على سبيل المثال: تأخر الطلب" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!canSubmit}/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="message">الرسالة</Label>
                <Textarea id="message" placeholder="اكتب تفاصيل الشكوى أو الاقتراح هنا..." rows={8} value={message} onChange={(e) => setMessage(e.target.value)} disabled={!canSubmit}/>
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading || !canSubmit}>
              {isLoading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'جاري الإرسال...' : 'إرسال'}
            </Button>
        </form>
      </div>
    </div>
  );
}
