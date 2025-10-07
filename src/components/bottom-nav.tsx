'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, User, Menu, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

const navItems = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/menu', label: 'القائمة', icon: Menu },
  { href: '/cart', label: 'السلة', icon: ShoppingCart },
  { href: '/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/account', label: 'حسابي', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50 h-16">
      <div className="flex justify-around h-full">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full text-sm font-medium transition-colors"
            >
              <item.icon
                className={cn(
                  'h-6 w-6 mb-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
