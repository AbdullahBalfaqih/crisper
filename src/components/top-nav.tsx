'use client';

import { Home, Menu, ShoppingCart, Bell, User } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';


const navItems = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/menu', label: 'القائمة', icon: Menu },
  { href: '/cart', label: 'السلة', icon: ShoppingCart },
  { href: '/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/account', label: 'حسابي', icon: User },
];

export const TopNav = () => {
    const pathname = usePathname();

    return (
        <div className={cn(
          "hidden md:block fixed left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4",
           "top-6"
        )}>
            <nav className="bg-black/70 backdrop-blur-sm text-white rounded-2xl flex items-center justify-around p-2">
                    {navItems.map(item => {
                         const isActive = pathname === item.href;
                        return (
                             <Link href={item.href} key={item.href} className="flex-1 text-center">
                                <Button variant="ghost" className={cn("text-white hover:bg-white/10 rounded-lg w-full", isActive && "bg-white/20")}>
                                    <span className='flex items-center gap-1'>
                                      <item.icon className="h-5 w-5" />
                                      <span>{item.label}</span>
                                    </span>
                                </Button>
                            </Link>
                        )
                    })}
            </nav>
        </div>
    );
};
