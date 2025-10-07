'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast.tsx';
import { UserPlus, Shield } from 'lucide-react';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAdminModal({ isOpen, onClose }: CreateAdminModalProps) {
    const { toast } = useToast();

    const handleCreate = () => {
        toast({
            title: 'تم الإنشاء بنجاح',
            description: 'تم إنشاء حساب مدير النظام الجديد.',
        });
        onClose();
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-primary">
            <UserPlus />
            إنشاء حساب مدير نظام
          </DialogTitle>
          <DialogDescription className="pt-2">
            قم بإنشاء حساب جديد بصلاحيات كاملة على النظام. يرجى استخدام بيانات آمنة.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input id="name" placeholder="على سبيل المثال: سعيد خير الله" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input id="phone" placeholder="96777XXXXXXX" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="admin@example.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input id="username" placeholder="saeed_admin" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" placeholder="••••••••••••"/>
            </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
            <Shield className="ml-2 h-4 w-4" />
            إنشاء الحساب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
