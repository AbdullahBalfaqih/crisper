'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Minus, Info, ShoppingCart, UserPlus, LogIn, Trash2, XCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart.tsx';
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
import { OrderTypeDialog } from '@/components/order-type-dialog';
import type { InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export default function CartPage() {
    const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
    const { user } = useAuth();
    const [isOrderTypeDialogOpen, setIsOrderTypeDialogOpen] = useState(false);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchInventory() {
            try {
                const res = await fetch('/api/inventory');
                if (res.ok) {
                    setInventory(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch inventory", error);
            }
        }
        fetchInventory();
    }, []);

    const getInventoryQuantity = (productId: string) => {
        return inventory.find(item => item.productId === productId)?.quantity || 0;
    };

    const handleQuantityChange = (id: string, notes: string | undefined, delta: number) => {
        const item = cart.find(i => i.id === id && i.notes === notes);
        if (item) {
            const newQuantity = item.quantity + delta;
            if (newQuantity > 0) {
                updateQuantity(id, newQuantity, notes);
            } else {
                removeFromCart(id, notes);
            }
        }
    };

    const handleCheckout = () => {
        for (const item of cart) {
            const availableQuantity = getInventoryQuantity(item.id);
            if (item.quantity > availableQuantity) {
                toast({
                    variant: "destructive",
                    title: "الكمية غير متوفرة",
                    description: `عذرًا، الكمية المطلوبة من "${item.name}" غير متوفرة في المخزون حاليًا.`,
                });
                return;
            }
        }
        setIsOrderTypeDialogOpen(true);
    };

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <>
            <div className="bg-background min-h-screen font-body text-foreground">
                <div className="container mx-auto max-w-lg p-4 pb-40">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-4">
                        <Link href="/" className="p-2">
                            <ArrowRight size={24} />
                        </Link>
                        <h1 className="text-xl font-bold">سلة التسوق</h1>
                        <div className="w-8">
                            {cart.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <XCircle className="h-6 w-6 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                هذا الإجراء سيقوم بتفريغ سلة التسوق الخاصة بك بالكامل. لا يمكن التراجع عن هذا الإجراء.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={clearCart} className="bg-destructive hover:bg-destructive/90">
                                                تأكيد
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </header>

                    {!user ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <ShoppingCart size={48} className="mx-auto mb-4" />
                            <p className="font-semibold text-lg mb-2">سلتك فارغة</p>
                            <p className="mb-6">لم يتم العثور على أي عناصر. الرجاء تسجيل الدخول أولاً.</p>
                            <div className="flex flex-col gap-3 max-w-xs mx-auto">
                                <Button asChild className="h-12 text-lg rounded-full">
                                    <Link href="/login"><LogIn className="mr-2" /> تسجيل الدخول</Link>
                                </Button>
                                <Button asChild variant="outline" className="h-12 text-lg rounded-full">
                                    <Link href="/signup"><UserPlus className="mr-2" /> إنشاء حساب</Link>
                                </Button>
                            </div>
                        </div>
                    ) : cart.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <ShoppingCart size={48} className="mx-auto mb-4" />
                            <p className="font-semibold text-lg mb-2">سلتك فارغة</p>
                            <p>لم تقم بإضافة أي منتجات إلى سلتك بعد.</p>
                        </div>
                    ) : (
                        <>
                            {/* Orders Section */}
                            <div className="flex justify-between items-center my-4">
                                <h2 className="text-lg font-bold">طلباتي</h2>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className="text-sm text-destructive hover:text-destructive">
                                            <XCircle size={16} className="mr-1" />
                                            <span>تفريغ السلة</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                هذا الإجراء سيقوم بتفريغ سلة التسوق الخاصة بك بالكامل. لا يمكن التراجع عن هذا الإجراء.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={clearCart} className="bg-destructive hover:bg-destructive/90">
                                                تأكيد
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>

                            {/* Cart Items */}
                            <div className="space-y-3">
                                {cart.map(item => {
                                    const availableQuantity = getInventoryQuantity(item.id);
                                    const isOutOfStock = item.quantity > availableQuantity;
                                    return (
                                        <div key={item.id + (item.notes || '')} className={cn("bg-card p-3 rounded-xl flex items-center gap-4 shadow-sm", isOutOfStock && "ring-2 ring-destructive")}>
                                            <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-lg object-cover" data-ai-hint={item.imageHint} />
                                            <div className="flex-1">
                                                <p className="font-semibold">{item.name}</p>
                                                <div className="flex items-baseline gap-2 mt-1 text-sm">
                                                    <span className="text-primary font-bold">{item.price.toLocaleString('ar-SA')} ر.ي</span>
                                                </div>
                                                {item.notes && <p className="text-xs text-muted-foreground mt-1">ملاحظات: {item.notes}</p>}
                                                {isOutOfStock && <div className="flex items-center gap-1 text-xs text-destructive mt-1"><AlertTriangle className="h-3 w-3" /><span>الكمية غير متوفرة</span></div>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, item.notes, -1)}
                                                    className="bg-muted text-muted-foreground h-7 w-7 rounded-full flex items-center justify-center"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, item.notes, 1)}
                                                    className="bg-primary text-primary-foreground h-7 w-7 rounded-full flex items-center justify-center"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.id, item.notes)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

                {user && cart.length > 0 && (
                    <footer className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 max-w-lg mx-auto md:bottom-0">
                        <Button
                            className="w-full h-14 bg-primary text-primary-foreground rounded-xl flex items-center px-4 text-lg"
                            onClick={handleCheckout}
                        >
                            <div className="relative">
                                <div className="bg-white text-primary rounded-full h-7 w-7 flex items-center justify-center text-sm font-bold">
                                    {totalItems}
                                </div>
                            </div>
                            <div className="flex-1 text-center font-semibold">
                                مراجعة العنوان
                            </div>
                            <div className="font-bold">
                                {totalPrice.toLocaleString('ar-SA')} ر.ي
                            </div>
                        </Button>
                    </footer>
                )}
            </div>
            <OrderTypeDialog
                isOpen={isOrderTypeDialogOpen}
                onClose={() => setIsOrderTypeDialogOpen(false)}
            />
        </>
    );
}
