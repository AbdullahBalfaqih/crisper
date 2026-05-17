
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ غير متوقع.');
      }

      setIsSubmitted(true);
      toast({
        title: 'تم إرسال الطلب',
        description: data.message,
      });

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background font-body p-4">
       <Link href="/login" className="absolute top-6 left-6 text-gray-600 hover:text-primary transition-colors">
          <ArrowRight size={24} />
       </Link>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">نسيت كلمة المرور</h1>
        </div>
        
        {isSubmitted ? (
            <div className="text-center space-y-4 p-8 bg-card rounded-2xl shadow-sm border">
                <Mail className="mx-auto h-16 w-16 text-primary" />
                <h2 className="text-2xl font-bold">تحقق من بريدك</h2>
                <p className="text-muted-foreground max-w-xs mx-auto">
                    إذا كان الحساب موجودًا ومربوطًا ببريد إلكتروني، فقد تم إرسال كلمة المرور إليه.
                </p>
                <Button asChild className="w-full mt-4">
                  <Link href="/login">العودة لتسجيل الدخول</Link>
                </Button>
            </div>
        ) : (
             <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-center text-muted-foreground">
                    أدخل البريد الإلكتروني المرتبط بحسابك.
                </p>
                <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                    id="identifier"
                    type="email"
                    placeholder="البريد الإلكتروني"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-12 pr-10 text-base bg-input border-border rounded-full"
                    />
                </div>
                 
                {error && (
                    <Alert variant="destructive">
                      <AlertTitle>خطأ</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-bold text-white bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-shadow" 
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'إرسال كلمة المرور'}
                </Button>
            </form>
        )}
      </div>
    </div>
  );
}
