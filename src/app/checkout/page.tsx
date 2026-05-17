'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Ticket, Upload, Banknote, ShieldCheck, Copy, X, Hourglass, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Bank } from '../components/banks-modal';
import { useAuth } from '@/hooks/use-auth';
import type { OrderType } from '@/components/order-details-sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


type Coupon = { id: string; type: 'percentage' | 'amount'; value: number; maxUses: number; used: number; };

const COUPON_ATTEMPTS_KEY = 'coupon_attempts';
const COUPON_LOCKOUT_KEY = 'coupon_lockout_timestamp';
const MAX_ATTEMPTS = 3;

function CheckoutContent() {
    const { user } = useAuth();
    const { cart, clearCart } = useCart();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [paymentProof, setPaymentProof] = useState<string | null>(null);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
    const [banks, setBanks] = useState<Bank[]>([]);
    const [selectedBank, setSelectedBank] = useState<string>('');
    const [coupons, setCoupons] = useState<Coupon[]>([]);

    const [couponAttempts, setCouponAttempts] = useState(0);
    const [isCouponLocked, setIsCouponLocked] = useState(false);
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

    // Extract order details from query params
    const orderType = searchParams.get('type') as OrderType || 'pickup';
    const addressId = searchParams.get('addressId');


    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    const finalTotal = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

    useEffect(() => {
        if (cart.length === 0 && orderStatus !== 'submitted') {
            toast({ variant: 'destructive', title: "سلة فارغة", description: "سلة التسوق الخاصة بك فارغة." });
            router.push('/');
        }

        const storedAttempts = parseInt(localStorage.getItem(COUPON_ATTEMPTS_KEY) || '0');
        const lockoutTimestamp = parseInt(localStorage.getItem(COUPON_LOCKOUT_KEY) || '0');
        const now = Date.now();

        if (lockoutTimestamp > now) {
            setIsCouponLocked(true);
            setLockoutTimeLeft(Math.ceil((lockoutTimestamp - now) / (1000 * 60)));
        } else {
            localStorage.removeItem(COUPON_LOCKOUT_KEY);
            localStorage.removeItem(COUPON_ATTEMPTS_KEY);
        }
        setCouponAttempts(storedAttempts);

        const fetchInitialData = async () => {
            try {
                const [banksRes, couponsRes] = await Promise.all([
                    fetch('/api/banks'),
                    fetch('/api/coupons')
                ]);
                if (banksRes.ok) {
                    const banksData = await banksRes.json();
                    setBanks(banksData);
                    if (banksData.length > 0) {
                        setSelectedBank(banksData[0].name);
                    }
                }
                if (couponsRes.ok) setCoupons(await couponsRes.json());
            } catch (error) {
                console.error("Failed to fetch checkout data", error);
            }
        }
        fetchInitialData();
    }, [cart, orderStatus, router, toast]);

    useEffect(() => {
        if (isCouponLocked) {
            const interval = setInterval(() => {
                const lockoutTimestamp = parseInt(localStorage.getItem(COUPON_LOCKOUT_KEY) || '0');
                const now = Date.now();
                const timeLeft = Math.ceil((lockoutTimestamp - now) / (1000 * 60));

                if (timeLeft > 0) {
                    setLockoutTimeLeft(timeLeft);
                } else {
                    setIsCouponLocked(false);
                    setLockoutTimeLeft(0);
                    setCouponAttempts(0);
                    localStorage.removeItem(COUPON_LOCKOUT_KEY);
                    localStorage.removeItem(COUPON_ATTEMPTS_KEY);
                    clearInterval(interval);
                }
            }, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [isCouponLocked]);


    const handleApplyCoupon = () => {
        if (isCouponLocked) {
            toast({ variant: 'destructive', title: 'محاولة لاحقًا', description: `تم تعطيل القسائم مؤقتًا. يرجى المحاولة مرة أخرى بعد ${lockoutTimeLeft} دقيقة.` });
            return;
        }

        const coupon = coupons.find(c => c.id.toUpperCase() === couponCode.toUpperCase());

        if (coupon) {
            if (coupon.type === 'percentage') {
                setDiscount((subtotal * coupon.value) / 100);
            } else {
                setDiscount(coupon.value);
            }
            toast({ title: 'تم تطبيق القسيمة', description: `تم تطبيق خصم بقيمة ${coupon.value}${coupon.type === 'percentage' ? '%' : ' ر.ي'}.` });
            setCouponAttempts(0); // Reset attempts on success
            localStorage.setItem(COUPON_ATTEMPTS_KEY, '0');
        } else {
            const newAttempts = couponAttempts + 1;
            setCouponAttempts(newAttempts);
            localStorage.setItem(COUPON_ATTEMPTS_KEY, newAttempts.toString());

            if (newAttempts >= MAX_ATTEMPTS) {
                const lockoutUntil = Date.now() + 60 * 60 * 1000; // 1 hour lockout
                localStorage.setItem(COUPON_LOCKOUT_KEY, lockoutUntil.toString());
                setIsCouponLocked(true);
                setLockoutTimeLeft(60);
                toast({ variant: 'destructive', title: 'تم تعطيل القسائم', description: 'لقد تجاوزت عدد المحاولات المسموح به. يرجى المحاولة مرة أخرى بعد ساعة.' });
            } else {
                toast({ variant: 'destructive', title: 'خطأ', description: `كود القسيمة غير صالح. (${MAX_ATTEMPTS - newAttempts} محاولات متبقية)` });
            }
        }
    };

    const handleCopyIban = (iban: string) => {
        navigator.clipboard.writeText(iban);
        toast({
            title: 'تم النسخ',
            description: `تم نسخ رقم الآيبان: ${iban}`
        });
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast({
                    variant: 'destructive',
                    title: 'خطأ في نوع الملف',
                    description: 'يرجى رفع ملف صورة فقط (مثل JPG, PNG).',
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPaymentProof(reader.result as string);
                toast({ title: 'تم رفع الصورة بنجاح' });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirmOrder = async () => {
        if (!paymentProof) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'يرجى رفع صورة إثبات الدفع أولاً.',
            });
            return;
        }

        if (!selectedBank) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'يرجى تحديد البنك الذي تم التحويل إليه.',
            });
            return;
        }

        setOrderStatus('submitting');

        const payload = {
            userId: user?.id,
            customer_name: user?.full_name,
            customer_phone: user?.phone_number,
            type: orderType,
            total_amount: subtotal,
            discount_amount: discount,
            final_amount: finalTotal,
            payment_method: 'تحويل بنكي',
            payment_status: 'paid', // Will be confirmed by admin
            payment_proof_url: paymentProof,
            address_id: addressId,
            items: cart,
            order_notes: `تحويل بنكي عبر: ${selectedBank}`,
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'فشل في إرسال الطلب.');
            }

            const newOrder = await response.json();

            setOrderStatus('submitted');
            clearCart();

            toast({
                title: 'تم إرسال طلبك بنجاح!',
                description: 'شكراً لك. سيتم مراجعة طلبك وتأكيده قريباً.',
            });

            router.push(`/track-order?id=${newOrder.id}`);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
            setOrderStatus('idle');
        }
    };

    if (orderStatus === 'submitted') {
        return (
            <div className="bg-background min-h-screen font-body text-foreground flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center shadow-lg">
                    <CardContent className="p-8">
                        <Hourglass className="mx-auto h-16 w-16 text-primary animate-pulse mb-6" />
                        <h1 className="text-2xl font-bold mb-2">تم إرسال طلبك بنجاح!</h1>
                        <p className="text-muted-foreground mb-8">
                            نحن نقوم بمراجعة طلبك الآن. سيتم إعلامك فور تأكيده والبدء في تجهيزه.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button className="h-12 text-lg" onClick={() => router.push('/track-order')}>تتبع حالة الطلب</Button>
                            <Button variant="outline" className="h-12 text-lg" onClick={() => router.push('/')}>العودة للرئيسية</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
        <div className="bg-background min-h-screen font-body text-foreground pb-40">
            <div className="container mx-auto max-w-lg p-4">
                {/* Header */}
                <header className="flex items-center justify-between mb-6">
                    <Link href="/addresses?flow=checkout" className="p-2">
                        <ArrowRight size={24} />
                    </Link>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <ShieldCheck />
                        إتمام عملية الدفع
                    </h1>
                    <div className="w-8"></div>
                </header>

                {/* Order Summary */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>ملخص الطلب</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center text-muted-foreground">
                            <span>المجموع الفرعي</span>
                            <span className="font-mono">{subtotal.toLocaleString('ar-SA')} ر.ي</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                id="coupon"
                                placeholder="أدخل كود القسيمة"
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value)}
                                className="h-10 flex-1"
                                disabled={isCouponLocked}
                            />
                            <Button variant="outline" onClick={handleApplyCoupon} disabled={!couponCode || isCouponLocked}>
                                <Ticket className="ml-2 h-4 w-4" />
                                تطبيق
                            </Button>
                        </div>
                        {isCouponLocked && (
                            <p className="text-xs text-destructive text-center">
                                تم تعطيل القسائم مؤقتاً. يرجى المحاولة بعد ${lockoutTimeLeft} دقيقة.
                            </p>
                        )}
                        {discount > 0 && (
                            <div className="flex justify-between items-center text-green-600 animate-in fade-in">
                                <span>الخصم</span>
                                <span className="font-mono">-{discount.toLocaleString('ar-SA')} ر.ي</span>
                            </div>
                        )}
                        <div className="border-t border-dashed my-2"></div>
                        <div className="flex justify-between items-center text-xl font-bold text-primary">
                            <span>الإجمالي للدفع</span>
                            <span className="font-mono">{finalTotal.toLocaleString('ar-SA')} ر.ي</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Transfer Details */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Banknote /> معلومات التحويل البنكي</CardTitle>
                        <CardDescription>
                            الرجاء تحويل المبلغ الإجمالي إلى أحد حساباتنا البنكية التالية ورفع صورة الإثبات.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {banks.map(bank => (
                            <div key={bank.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="space-y-1">
                                    <p className="font-semibold">{bank.name}</p>
                                    <p className="text-sm text-muted-foreground font-mono" dir="ltr">{bank.iban}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleCopyIban(bank.iban)}>
                                    <Copy className="h-5 w-5" />
                                </Button>
                            </div>
                        ))}
                        {banks.length === 0 && (
                            <p className="text-muted-foreground text-center p-4">لا توجد حسابات بنكية مهيئة حالياً.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Proof */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Upload /> رفع إثبات الدفع</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-select">البنك الذي تم التحويل إليه</Label>
                            <Select value={selectedBank} onValueChange={setSelectedBank}>
                                <SelectTrigger id="bank-select">
                                    <SelectValue placeholder="اختر البنك..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks.map(bank => (
                                        <SelectItem key={bank.id} value={bank.name}>{bank.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentProof ? (
                            <div className="relative group aspect-video w-full">
                                <Image src={paymentProof} alt="إثبات الدفع" layout="fill" className="rounded-lg object-contain bg-muted" />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 left-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setPaymentProof(null)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        ) : (
                            <div className="relative border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">اسحب وأفلت الصورة هنا، أو انقر للاختيار</p>
                                <Input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            <footer className="fixed bottom-16 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 max-w-lg mx-auto md:bottom-0">
                <Button
                    className="w-full h-14 text-lg"
                    onClick={handleConfirmOrder}
                    disabled={!paymentProof || orderStatus === 'submitting'}
                >
                    {orderStatus === 'submitting' ? <Loader2 className="animate-spin" /> : 'إتمام وتأكيد الطلب'}
                </Button>
            </footer>

        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}