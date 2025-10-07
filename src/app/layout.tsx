'use client';

import React from 'react';
import { Almarai } from 'next/font/google';
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/hooks/use-cart.tsx';
import { AuthProvider } from '@/hooks/use-auth';

const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['300', '400', '700', '800'],
  variable: '--font-almarai',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  
  const isClientFacing = !isAdminRoute && !isAuthRoute;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <title>نظام المطاعم</title>
        <meta name="description" content="نظام حديث لإدارة المطاعم." />
      </head>
      <body className={cn("antialiased", almarai.className)}>
        <AuthProvider>
          <CartProvider>
            {isClientFacing ? (
              <>
                <TopNav />
                <BottomNav />
                <main className="flex-1 pb-20">
                    {children}
                </main>
              </>
            ) : (
                <main className="flex-1">
                    {children}
                </main>
            )}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
