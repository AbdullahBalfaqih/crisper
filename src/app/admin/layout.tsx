'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AppContainer } from '@/components/app-container';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'system_admin') {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-center p-8">
                <ShieldAlert className="h-16 w-16 text-destructive" />
                <h1 className="text-3xl font-bold">الوصول مرفوض</h1>
                <p className="text-muted-foreground max-w-sm">
                    ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة. هذا القسم مخصص لمدراء النظام فقط.
                </p>
                <Button onClick={() => router.replace('/')}>
                    العودة إلى الصفحة الرئيسية
                </Button>
            </div>
      </div>
    );
  }
  
  return <AppContainer>{children}</AppContainer>;
}
