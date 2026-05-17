'use client';

import React, { useState, useEffect } from 'react';
import { Bell, UserPlus, LogIn, Clock, PackageCheck, Bike, Trash2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type Notification = {
    id: number;
    message: string;
    link: string | null;
    status: 'read' | 'unread';
    created_at: string;
};

const getNotificationIcon = (message: string) => {
    if (message.includes('تجهيز')) return <PackageCheck className="text-blue-500" size={24} />;
    if (message.includes('الطريق')) return <Bike className="text-indigo-500" size={24} />;
    return <Clock className="text-gray-500" size={24} />;
};

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationToDelete, setNotificationToDelete] = useState<number | 'all' | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!loading && user) {
            const fetchNotifications = async () => {
                try {
                    const res = await fetch(`/api/notifications?userId=${user.id}`);
                    if (res.ok) {
                        setNotifications(await res.json());
                    }
                } catch (error) {
                    console.error("Failed to fetch notifications", error);
                }
            };
            fetchNotifications();
        }
    }, [user, loading]);
    
     const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (notification.status === 'unread') {
            try {
                await fetch(`/api/notifications?id=${notification.id}`, { method: 'PUT' });
                setNotifications(prev => 
                    prev.map(n => n.id === notification.id ? {...n, status: 'read'} : n)
                );
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            }
        }
        // Navigate
        if (notification.link) {
            router.push(notification.link);
        }
    };
    
    const handleDeleteNotification = async () => {
        if (!notificationToDelete) return;

        let url = '/api/notifications';
        if (notificationToDelete !== 'all') {
            url += `?id=${notificationToDelete}`;
        } else if (user) {
            url += `?userId=${user.id}`;
        }

        try {
            const response = await fetch(url, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete notification(s)');

            if (notificationToDelete === 'all') {
                setNotifications([]);
                toast({ description: 'تم حذف جميع الإشعارات.' });
            } else {
                setNotifications(prev => prev.filter(n => n.id !== notificationToDelete));
                toast({ description: 'تم حذف الإشعار.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الإشعارات.' });
        } finally {
            setNotificationToDelete(null);
        }
    };


    return (
        <div className="bg-background min-h-screen font-body text-foreground pb-20">
            <div className="container mx-auto max-w-lg p-4">
                {/* Header */}
                <header className="flex items-center justify-between mb-6 relative">
                    <div className="w-8"></div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        الإشعارات
                        <Bell />
                    </h1>
                     <div className="w-8">
                         {notifications.length > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setNotificationToDelete('all')}>
                                        <XCircle className="h-6 w-6 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                {notificationToDelete === 'all' && (
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                سيتم حذف جميع إشعاراتك نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => setNotificationToDelete(null)}>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteNotification} className="bg-destructive hover:bg-destructive/90">
                                                تأكيد الحذف
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                )}
                            </AlertDialog>
                         )}
                     </div>
                </header>

                {!user && !loading ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Bell size={48} className="mx-auto mb-4" />
                        <p className="font-semibold text-lg mb-2">لا توجد إشعارات</p>
                        <p className="mb-6">يرجى تسجيل الدخول لعرض الإشعارات الخاصة بك.</p>
                        <div className="flex flex-col gap-3 max-w-xs mx-auto">
                            <Button asChild className="h-12 text-lg rounded-full">
                                <Link href="/login"><LogIn className="mr-2" /> تسجيل الدخول</Link>
                            </Button>
                            <Button asChild variant="outline" className="h-12 text-lg rounded-full">
                                <Link href="/signup"><UserPlus className="mr-2" /> إنشاء حساب</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <AlertDialog key={notif.id}>
                                <div 
                                    className={`bg-card p-4 rounded-xl flex items-start gap-4 shadow-sm hover:bg-muted/50 transition-colors cursor-pointer ${notif.status === 'unread' ? 'border-l-4 border-primary' : ''}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="mt-1">
                                        {getNotificationIcon(notif.message)}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-semibold ${notif.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.message}</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ar })}
                                        </p>
                                    </div>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 shrink-0" 
                                          onClick={(e) => { e.stopPropagation(); setNotificationToDelete(notif.id); }}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                </div>
                                {notificationToDelete === notif.id && (
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                 سيتم حذف هذا الإشعار نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => setNotificationToDelete(null)}>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteNotification} className="bg-destructive hover:bg-destructive/90">
                                                تأكيد الحذف
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                )}
                                </AlertDialog>
                            ))
                        ) : (
                            <div className="text-center py-20 text-muted-foreground">
                                <Bell size={48} className="mx-auto mb-4" />
                                <p>لا توجد إشعارات حاليًا.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
