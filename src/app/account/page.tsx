'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, User, LogIn, UserPlus, FileText, MapPin, Heart, MessageSquareWarning, Power, Package } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/use-auth';


const loggedOutMenuItems = [
    { href: '/login', icon: LogIn, title: 'تسجيل الدخول', description: 'الوصول إلى حسابك الحالي' },
    { href: '/signup', icon: UserPlus, title: 'إنشاء حساب', description: 'انضم إلينا واستمتع بمزايا حصرية' },
];

const loggedInMenuItems = [
    { href: '/track-order', icon: Package, title: 'تتبع طلبي الحالي', description: 'عرض حالة طلبك الأخير' },
    { href: '/orders-history', icon: FileText, title: 'طلباتي السابقة', description: 'عرض سجل طلباتك' },
    { href: '/addresses', icon: MapPin, title: 'عناويني', description: 'إدارة عناوين التوصيل الخاصة بك' },
    { href: '/favorites', icon: Heart, title: 'المفضلة', description: 'المنتجات التي قمت بحفظها' },
    { href: '/complaints', icon: MessageSquareWarning, title: 'الشكاوى والاقتراحات', description: 'تواصل معنا إذا كانت لديك شكوى أو اقتراح' },
];


export default function AccountPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const menuItems = user ? loggedInMenuItems : loggedOutMenuItems;
    
    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="bg-background min-h-screen font-body text-foreground pb-20">
            <div className="container mx-auto max-w-lg p-4">
                {/* Header */}
                <header className="flex items-center justify-center mb-6 relative">
                    <h1 className="text-xl font-bold">حسابي</h1>
                </header>

                {/* User Info Card */}
                <div className="mb-8 text-center">
                    <div className="p-6 flex flex-col items-center gap-3">
                         <Avatar className="w-24 h-24 border-4 border-primary/50">
                            <AvatarFallback>
                                <User className="w-12 h-12 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                        {user ? (
                            <>
                                <h2 className="text-2xl font-bold">{user.full_name}</h2>
                                <p className="text-muted-foreground">{user.email}</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold">زائر</h2>
                                <p className="text-muted-foreground">سجل الدخول لعرض ملفك الشخصي</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-3">
                    {menuItems.map(item => (
                         <Link href={item.href} key={item.href} className="block bg-card p-4 rounded-xl shadow-sm hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <item.icon className="w-6 h-6 text-primary"/>
                                <div className="flex-1">
                                    <p className="font-semibold">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                            </div>
                         </Link>
                    ))}
                     {user && (
                        <div className="pt-4">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full">
                                        تسجيل الخروج
                                        <Power className="ml-2" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>هل تريد حقًا تسجيل الخروج؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        سيؤدي هذا الإجراء إلى تسجيل خروجك من حسابك. ستحتاج إلى إعادة تسجيل الدخول للوصول إلى حسابك مرة أخرى.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
                                        تأكيد
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
