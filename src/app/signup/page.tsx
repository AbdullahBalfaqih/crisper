
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.tsx';
import { useRouter } from 'next/navigation';
import { Loader2, User, Lock, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logo, setLogo] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const settings = await res.json();
                    if (settings.logo_base64) {
                        setLogo(settings.logo_base64);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch logo", error);
            }
        };
        fetchLogo();
    }, []);

    const validatePhoneNumber = (number: string) => {
        const validPrefixes = ['70', '71', '73', '77', '78'];
        if (number.length !== 9) {
            return false;
        }
        return validPrefixes.some(prefix => number.startsWith(prefix));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (username.length < 5) {
            setError('يجب أن يتكون اسم المستخدم من 5 أحرف على الأقل.');
            return;
        }

        if (!validatePhoneNumber(phone)) {
            setError('رقم الهاتف غير صالح. يجب أن يتكون من 9 أرقام ويبدأ بـ 70, 71, 73, 77, أو 78.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    username,
                    phone_number: `+967${phone}`,
                    email,
                    password,
                    role: 'customer'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'حدث خطأ غير متوقع.');
            }

            toast({
                title: 'تم إنشاء الحساب بنجاح',
                description: `أهلاً بك، ${data.full_name}! يمكنك الآن تسجيل الدخول.`,
            });
            router.push('/login');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background font-body p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          {logo && <Image src={logo} alt="Logo" width={150} height={150} className="mx-auto" />}
          <h1 className="text-4xl font-bold text-gray-800">إنشاء حساب</h1>
          <p className="text-muted-foreground">أدخل معلوماتك لإنشاء حساب جديد</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input id="full-name" type="text" placeholder="الاسم الثلاثي" required value={fullName} onChange={e => setFullName(e.target.value)} className="h-12 pr-10 text-base bg-input border-none rounded-full" />
          </div>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input id="username" type="text" placeholder="اسم المستخدم" required value={username} onChange={e => setUsername(e.target.value)} className="h-12 pr-10 text-base bg-input border-none rounded-full" />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 text-gray-400 flex items-center gap-2">
                <span className="text-sm">+967</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 20 15"><rect width="20" height="5" fill="#D21034"/><rect y="5" width="20" height="5" fill="#fff"/><rect y="10" width="20" height="5" fill="#000"/></svg>
            </span>
            <Input id="phone" type="tel" placeholder="7xxxxxxxx" required value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))} className="h-12 pl-24 text-base bg-input border-none rounded-full" dir="ltr" />
          </div>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input id="email" type="email" placeholder="البريد الإلكتروني (اختياري لتلقي العروض)" value={email} onChange={e => setEmail(e.target.value)} className="h-12 pr-10 text-base bg-input border-none rounded-full"/>
          </div>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="كلمة المرور" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 pr-10 text-base bg-input border-none rounded-full"/>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400">
                {showPassword ? <EyeOff/> : <Eye/>}
            </button>
          </div>
          
          {error && (
             <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-bold text-white bg-gradient-to-r from-primary to-accent rounded-full shadow-lg hover:shadow-xl transition-shadow" 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'إنشاء الحساب'}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            هل لديك حساب بالفعل؟{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
