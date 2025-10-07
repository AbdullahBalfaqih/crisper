'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, User, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import Image from 'next/image';

const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [logo, setLogo] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  
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

    const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
    const lockout = parseInt(localStorage.getItem('lockoutTime') || '0');
    const now = new Date().getTime();

    if (lockout > now) {
      setLockoutTime(lockout);
    } else {
      setLoginAttempts(attempts);
    }
  }, []);

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        if (lockoutTime <= now) {
          clearInterval(timer);
          setLockoutTime(0);
          setLoginAttempts(0);
          localStorage.removeItem('loginAttempts');
          localStorage.removeItem('lockoutTime');
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockoutTime > new Date().getTime()) {
      const remainingTime = Math.ceil((lockoutTime - new Date().getTime()) / (1000 * 60));
      setError(`تم حظر تسجيل الدخول. يرجى المحاولة مرة أخرى بعد ${remainingTime} دقائق.`);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('loginAttempts', newAttempts.toString());
        
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const newLockoutTime = new Date().getTime() + LOCKOUT_DURATION;
          setLockoutTime(newLockoutTime);
          localStorage.setItem('lockoutTime', newLockoutTime.toString());
          setError(`تم تجاوز عدد المحاولات. تم حظر تسجيل الدخول لمدة 10 دقائق.`);
        } else {
            setError(`${data.message || 'حدث خطأ غير متوقع.'} (محاولات متبقية: ${MAX_LOGIN_ATTEMPTS - newAttempts})`);
        }
        
      } else {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockoutTime');
        setLoginAttempts(0);
      
        await login(data.user);
        
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: `أهلاً بك، ${data.user.full_name}!`,
        });

        if (data.user.role === 'system_admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isLockedOut = lockoutTime > new Date().getTime();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background font-body p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          {logo && <Image src={logo} alt="Logo" width={150} height={150} className="mx-auto mb-4" />}
          <h1 className="text-4xl font-bold text-gray-800">تسجيل الدخول</h1>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="username"
              type="text"
              placeholder="اسم المستخدم"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 pr-10 text-base bg-input border-none rounded-full"
              disabled={isLockedOut}
            />
          </div>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="كلمة المرور"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pr-10 text-base bg-input border-none rounded-full"
              disabled={isLockedOut}
            />
          </div>
          
          <div className="flex items-center justify-end text-sm">
            <Link href="/forgot-password" className="font-medium text-gray-600 hover:text-primary">
              هل نسيت كلمة المرور؟
            </Link>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>خطأ في تسجيل الدخول</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-bold text-white bg-gradient-to-r from-primary to-accent rounded-full shadow-lg hover:shadow-xl transition-shadow" 
            disabled={isLoading || isLockedOut}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'تسجيل الدخول'}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            لست عضوا؟{' '}
            <Link href="/signup" className="font-bold text-primary hover:underline">
              أنشئ حسابك الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
