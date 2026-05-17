'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ModalType, ViewType } from './app-container';
import {
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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

import {
  AreaChart,
  BookText,
  Boxes,
  Briefcase,
  ChevronDown,
  ClipboardList,
  ClipboardPlus,
  Clock,
  Contact,
  CreditCard,
  HeartHandshake,
  LayoutGrid,
  LogOut,
  Settings,
  MessageSquareWarning,
  Server,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Mail,
  Receipt,
  BookUser,
  ShoppingBasket,
  Globe,
  Archive,
  Ticket,
  UserCog,
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';


interface SidebarNavProps {
  setActiveModal: (modal: ModalType) => void;
  setActiveView: (view: ViewType) => void;
}

const mainNavItems = [
  { id: 'pos', label: 'نقطة البيع', icon: ShoppingBasket, isView: true, permission: 'pos' },
  { id: 'statistics', label: 'الإحصائيات والتقارير', icon: AreaChart, isView: false, permission: 'statistics' },
  { id: 'orders', label: 'سجل الطلبات', icon: ShoppingCart, isView: false, permission: 'orders' },
  { id: 'daily-summary', label: 'سجل الملخصات اليومية', icon: Archive, isView: false, permission: 'daily-summary' },
  { id: 'online-orders', label: 'طلبات الأونلاين', icon: Server, isView: false, permission: 'online-orders' },
  { id: '/', label: 'صفحة الطلبات', icon: Globe, isView: true, isLink: true, permission: 'pos' }, // Assume pos permission for storefront
];

const customerNavItems = [
    { id: 'customers', label: 'العملاء', icon: Contact, permission: 'customers' },
    { id: 'complaints', label: 'الشكاوى', icon: MessageSquareWarning, permission: 'complaints' },
    { id: 'hospitality', label: 'الضيافة', icon: HeartHandshake, permission: 'hospitality' },
    { id: 'email', label: 'البريد الالكتروني', icon: Mail, permission: 'email' },
    { id: 'coupons', label: 'القسائم الشرائية', icon: Ticket, permission: 'coupons' },
];

const inventoryManagementItems = [
  { id: 'categories', label: 'الأصناف', icon: LayoutGrid, permission: 'categories' },
  { id: 'recipes', label: 'الوصفات', icon: BookText, permission: 'recipes' },
  { id: 'purchases', label: 'المشتريات', icon: Boxes, permission: 'purchases' },
  { id: 'suppliers', label: 'الموردين', icon: UserCog, permission: 'purchases' }, // Assuming same permission as purchases
  { id: 'inventory', label: 'المخزون', icon: Warehouse, permission: 'inventory' },
  { id: 'needs', label: 'الاحتياجات', icon: ClipboardPlus, permission: 'needs' },
];

const adminItems = [
  { id: 'accounting-fund', label: 'الصندوق المحاسبي', icon: Receipt, permission: 'accounting-fund' },
  { id: 'expenses', label: 'المصروفات', icon: CreditCard, permission: 'expenses' },
  { id: 'debts', label: 'الديون', icon: ClipboardList, permission: 'debts' },
  { id: 'employees', label: 'الموظفين', icon: BookUser, permission: 'employees' },
  { id: 'accounts', label: 'الحسابات', icon: Wallet, permission: 'accounts' },
  { id: 'peak-hours', label: 'ساعات الذروة', icon: Clock, permission: 'peak-hours' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, permission: 'settings' },
];

interface NavGroupProps {
  title: string;
  icon: React.ElementType;
  items: {id: string, label: string, icon: React.ElementType, isView?: boolean, isLink?: boolean, permission: string}[];
  setActiveModal: (modal: ModalType) => void;
  setActiveView: (view: ViewType) => void;
  defaultOpen?: boolean;
}

const NavGroup: React.FC<NavGroupProps> = ({ title, icon: GroupIcon, items, setActiveModal, setActiveView, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { permissions } = useAuth();
  
  const visibleItems = items.filter(item => permissions[item.permission]);
  
  if (visibleItems.length === 0) {
      return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
         <Button variant="ghost" className="w-full justify-between h-12 text-sm font-semibold">
           <div className="flex items-center gap-3">
            <GroupIcon className="h-5 w-5 text-primary" />
            {title}
           </div>
           <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 space-y-1 py-1 data-[state=closed]:hidden">
        {visibleItems.map(item => {
            if (item.isLink) {
                return (
                    <Link href={item.id} key={item.id}>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 h-10 text-sm"
                        >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Button>
                    </Link>
                )
            }
            return (
                <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10 text-sm"
                    onClick={() => item.isView ? setActiveView(item.id as ViewType) : setActiveModal(item.id as ModalType)}
                    >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                </Button>
            )
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}


export function SidebarNav({ setActiveModal, setActiveView }: SidebarNavProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          setLogo(settings.logo_base64 || null);
        }
      } catch (error) {
        console.error("Failed to fetch logo for sidebar", error);
      }
    };
    fetchLogo();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
      return null; // Or a loading spinner
  }

  return (
    <>
      <SidebarHeader>
        {logo ? (
          <div className="flex justify-center p-2">
            <Image src={logo} alt="Restaurant Logo" width={140} height={70} style={{ objectFit: 'contain' }} />
          </div>
        ) : (
          <h2 className="text-xl font-bold text-primary tracking-tight p-2 text-center">
            نظام المطاعم
          </h2>
        )}
      </SidebarHeader>
      <SidebarContent className="p-2 space-y-2">
        <NavGroup 
          title="عمليات البيع"
          icon={ShoppingBasket}
          items={mainNavItems}
          setActiveModal={setActiveModal}
          setActiveView={setActiveView}
          defaultOpen={true}
        />
        <NavGroup 
          title="إدارة علاقات العملاء"
          icon={Users}
          items={customerNavItems}
          setActiveModal={setActiveModal}
          setActiveView={setActiveView}
        />
        <NavGroup 
          title="إدارة المطعم"
          icon={LayoutGrid}
          items={inventoryManagementItems}
          setActiveModal={setActiveModal}
          setActiveView={setActiveView}
        />
         <NavGroup 
          title="الشؤون الإدارية والمالية"
          icon={Briefcase}
          items={adminItems}
          setActiveModal={setActiveModal}
          setActiveView={setActiveView}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center justify-between gap-3 p-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                    <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm group-data-[collapsible=icon]:hidden">
                    <span className="font-semibold text-sidebar-foreground">{user.full_name}</span>
                    <span className="text-xs text-sidebar-foreground/70">{user.role === 'system_admin' ? 'مدير نظام' : 'موظف'} - الفرع الرئيسي</span>
                </div>
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد أنك تريد تسجيل الخروج؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        سيؤدي هذا الإجراء إلى إنهاء جلستك الحالية. ستحتاج إلى إعادة تسجيل الدخول للوصول إلى لوحة التحكم.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">تسجيل الخروج</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </SidebarFooter>
    </>
  );
}
