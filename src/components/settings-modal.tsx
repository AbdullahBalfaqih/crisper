'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Image as ImageIcon, Database, Shield, Lock, Save, TestTubeDiagonal, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModalType } from './app-container';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


type User = { 
  id: string; 
  full_name: string;
  username: string; 
  email: string; 
  role: 'system_admin' | 'employee' | 'customer';
};

const allPermissions = [
    { id: 'pos', label: 'نقطة البيع' },
    { id: 'statistics', label: 'الإحصائيات والتقارير' },
    { id: 'orders', label: 'سجل الطلبات' },
    { id: 'daily-summary', label: 'سجل الملخصات اليومية' },
    { id: 'online-orders', label: 'طلبات الأونلاين' },
    { id: 'delivery', label: 'التوصيل' },
    { id: 'customers', label: 'العملاء' },
    { id: 'complaints', label: 'الشكاوى' },
    { id: 'hospitality', label: 'الضيافة' },
    { id: 'email', label: 'البريد الالكتروني' },
    { id: 'coupons', label: 'القسائم الشرائية' },
    { id: 'categories', label: 'الأصناف' },
    { id: 'recipes', label: 'الوصفات' },
    { id: 'purchases', label: 'المشتريات' },
    { id: 'inventory', label: 'المخزون' },
    { id: 'needs', label: 'الاحتياجات' },
    { id: 'accounting-fund', label: 'الصندوق المحاسبي' },
    { id: 'expenses', label: 'المصروفات' },
    { id: 'debts', label: 'الديون' },
    { id: 'employees', label: 'الموظفين' },
    { id: 'accounts', label: 'الحسابات' },
    { id: 'peak-hours', label: 'ساعات الذروة' },
    { id: 'settings', label: 'الإعدادات' },
];


type Permissions = { [key: string]: boolean };
type SmtpSettings = { email: string; password?: string; server: string; ssl: boolean };

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  openModal: (modal: ModalType) => void;
}


export function SettingsModal({ isOpen, onClose, openModal }: SettingsModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permissions>({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({ email: '', password: '', server: '', ssl: false });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [alertContent, setAlertContent] = useState<{ title: string; onConfirm: () => void } | null>(null);


   useEffect(() => {
    if (isOpen) {
        const fetchInitialData = async () => {
            try {
                // Fetch users
                const usersResponse = await fetch('/api/users');
                if (!usersResponse.ok) throw new Error('Failed to fetch users');
                const allUsers: User[] = await usersResponse.json();
                const nonCustomerUsers = allUsers.filter(user => user.role !== 'customer');
                setUsers(nonCustomerUsers);
                if (nonCustomerUsers.length > 0 && !selectedUser) {
                    setSelectedUser(nonCustomerUsers[0]);
                }
                
                // Fetch settings
                const settingsResponse = await fetch('/api/settings');
                if (!settingsResponse.ok) throw new Error('Failed to fetch settings');
                const settingsData = await settingsResponse.json();
                setSmtpSettings({
                    email: settingsData.smtp_email || '',
                    server: settingsData.smtp_server || '',
                    password: '', // Password is not fetched for security
                    ssl: settingsData.smtp_ssl === 'true'
                });
                setLogoPreview(settingsData.logo_base64 || null);
                setBarcodePreview(settingsData.barcode_base64 || null);

            } catch (error) {
                toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب البيانات الأولية.' });
            }
        };
        fetchInitialData();
    }
  }, [isOpen, toast, selectedUser]);


  const fetchPermissions = useCallback(async (userId: string) => {
    setIsLoadingPermissions(true);
    try {
      const response = await fetch(`/api/permissions/${userId}`);
      if (response.status === 404) {
          const isAdmin = users.find(u => u.id.toString() === userId)?.role === 'system_admin';
          const defaultPerms = allPermissions.reduce((acc, perm) => ({...acc, [perm.id]: isAdmin }), {} as Permissions);
          setUserPermissions(defaultPerms);
          return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const data = await response.json();
      setUserPermissions(data.permissions);
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب صلاحيات المستخدم.' });
      const isAdmin = users.find(u => u.id.toString() === userId)?.role === 'system_admin';
      const defaultPerms = allPermissions.reduce((acc, perm) => ({...acc, [perm.id]: isAdmin }), {} as Permissions);
      setUserPermissions(defaultPerms);
    } finally {
        setIsLoadingPermissions(false);
    }
  }, [toast, users]);


  useEffect(() => {
    if (selectedUser) {
      fetchPermissions(selectedUser.id.toString());
    } else {
      setUserPermissions({});
    }
  }, [selectedUser, fetchPermissions]);


  const handlePermissionChange = (permId: string, checked: boolean) => {
    setUserPermissions(prev => ({ ...prev, [permId]: checked }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/permissions/${selectedUser.id.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: userPermissions }),
      });
      if (!response.ok) throw new Error('Failed to save permissions');
      
      toast({
        title: 'تم حفظ الصلاحيات',
        description: `تم تحديث صلاحيات المستخدم ${selectedUser.username}.`,
      });
    } catch (error) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'فشل حفظ الصلاحيات. يرجى المحاولة مرة أخرى.',
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleSmtpChange = (field: keyof SmtpSettings, value: string | boolean) => {
    setSmtpSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEmail = async () => {
     setIsSaving(true);
     try {
        const settingsToSave: any = {
            'smtp_email': smtpSettings.email,
            'smtp_server': smtpSettings.server,
            'smtp_ssl': String(smtpSettings.ssl),
        };
        // Only include password if it has been changed
        if (smtpSettings.password) {
            settingsToSave['smtp_password'] = smtpSettings.password;
        }

        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsToSave),
        });

        if (!response.ok) throw new Error('Failed to save SMTP settings');

        toast({
            title: 'تم حفظ إعدادات البريد',
            description: `تم تحديث إعدادات SMTP بنجاح.`,
        });

     } catch(error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ إعدادات البريد.' });
     } finally {
        setIsSaving(false);
     }
  };
  
   const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
   const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setBarcodePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
        const payload: { [key: string]: any } = {};
        if (logoPreview) payload['logo_base64'] = logoPreview;
        if (barcodePreview) payload['barcode_base64'] = barcodePreview;

        if (Object.keys(payload).length > 0) {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            toast({ title: 'تم الحفظ', description: 'تم حفظ الإعدادات العامة بنجاح.'});
        }
    } catch(error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ الإعدادات العامة.' });
    } finally {
        setIsSaving(false);
    }
  };


  const handleBackupAction = async () => {
      toast({ title: 'جاري إنشاء النسخة الاحتياطية...', description: 'قد تستغرق هذه العملية بعض الوقت.' });
      setIsSaving(true);
      try {
          const response = await fetch('/api/backup');
          if (!response.ok) throw new Error('Failed to create backup');
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'backup.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          toast({ title: 'تم إنشاء النسخة بنجاح' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إنشاء النسخة الاحتياطية.' });
      } finally {
          setIsSaving(false);
      }
  };

  const handleRestoreAction = () => {
    setAlertContent({
        title: 'هل تريد بالتأكيد استعادة البيانات من نسخة احتياطية؟',
        onConfirm: () => {
            restoreInputRef.current?.click();
        }
    });
  };

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    toast({ title: 'جاري استعادة البيانات...', description: 'قد تستغرق هذه العملية بعض الوقت. لا تغلق النافذة.' });

    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/restore', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to restore data');
        }
        toast({ title: 'تمت الاستعادة بنجاح', description: 'تم استعادة بياناتك من النسخة الاحتياطية.' });
        // Optionally, force a page reload or refetch all data across the app
        window.location.reload();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'فشل الاستعادة', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 bg-destructive text-destructive-foreground">
          <DialogTitle className="text-2xl flex items-center gap-2"><Shield /> إعدادات النظام</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> إدارة الصلاحيات للمستخدمين</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label>المستخدمين</Label>
                  <ScrollArea className="h-48 border rounded-md bg-background">
                    {users.map(user => (
                      <div
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className={cn(
                          "p-2 cursor-pointer hover:bg-muted",
                          selectedUser?.id === user.id && "bg-muted font-semibold"
                        )}
                      >
                        {user.username} ({user.role === 'system_admin' ? 'مدير' : 'موظف'})
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                <div className="col-span-2">
                   <Label>الصلاحيات</Label>
                   <ScrollArea className="h-48 border rounded-md p-3 relative">
                      {isLoadingPermissions && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                              <Loader2 className="h-6 w-6 animate-spin"/>
                          </div>
                      )}
                      {allPermissions.map(perm => (
                        <div key={perm.id} className="flex items-center gap-2 mb-2">
                          <Checkbox
                            id={perm.id}
                            checked={userPermissions[perm.id] || false}
                            onCheckedChange={(checked) => handlePermissionChange(perm.id, !!checked)}
                            disabled={isLoadingPermissions || selectedUser?.role === 'system_admin'}
                          />
                          <Label htmlFor={perm.id} className="font-normal">{perm.label}</Label>
                        </div>
                      ))}
                   </ScrollArea>
                </div>
                <div className="col-span-3">
                   <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSavePermissions} disabled={isSaving || !selectedUser || selectedUser.role === 'system_admin'}>
                     {isSaving ? <Loader2 className="ml-2 animate-spin" /> : <Save className="ml-2"/>}
                     حفظ الصلاحيات
                   </Button>
                </div>
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database /> النسخ الاحتياطي</CardTitle>
                <CardDescription>إدارة النسخ الاحتياطية لقاعدة البيانات.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-around gap-4">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleBackupAction}>إنشاء نسخة احتياطية</Button>
                  <Button variant="outline" className="flex-1" onClick={handleRestoreAction}>استعادة نسخة</Button>
                  <Input type="file" ref={restoreInputRef} className="hidden" accept=".json" onChange={handleRestoreFileChange} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail /> تحديد البريد الإلكتروني في النظام</CardTitle>
                <CardDescription>إعدادات SMTP لإرسال رسائل البريد الإلكتروني.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="smtp-email">البريد الإلكتروني</Label>
                    <Input id="smtp-email" type="email" placeholder="email@example.com" value={smtpSettings.email} onChange={(e) => handleSmtpChange('email', e.target.value)}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="smtp-password">كلمة مرور التطبيق</Label>
                    <Input id="smtp-password" type="password" placeholder="••••••••••••••••" value={smtpSettings.password} onChange={(e) => handleSmtpChange('password', e.target.value)}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="smtp-server">مزود الخدمة (SMTP)</Label>
                    <Input id="smtp-server" placeholder="smtp.gmail.com" value={smtpSettings.server} onChange={(e) => handleSmtpChange('server', e.target.value)}/>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Switch id="ssl-mode" checked={smtpSettings.ssl} onCheckedChange={(checked) => handleSmtpChange('ssl', checked)}/>
                        <Label htmlFor="ssl-mode" className="font-normal">تفعيل SSL</Label>
                    </div>
                    <Button variant="outline"><TestTubeDiagonal className="ml-2"/> اختبار</Button>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSaveEmail} disabled={isSaving}><Save className="ml-2"/>حفظ إعدادات البريد</Button>
              </CardContent>
            </Card>
            
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ImageIcon /> إعدادات عامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>شعار النظام</Label>
                      <Card 
                        className="aspect-video w-full relative group bg-muted/50 overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {logoPreview ? ( <Image src={logoPreview} alt="معاينة" layout="fill" objectFit="contain" /> ) : (
                          <div className="text-muted-foreground text-center"><Upload className="mx-auto h-8 w-8 mb-1"/><span>رفع شعار</span></div>
                        )}
                        <Input ref={logoInputRef} id="logo-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/png, image/jpeg" onChange={handleLogoChange}/>
                      </Card>
                    </div>
                     <div className="space-y-2">
                      <Label>صورة الباركود</Label>
                      <Card 
                        className="aspect-video w-full relative group bg-muted/50 overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer"
                        onClick={() => barcodeInputRef.current?.click()}
                      >
                        {barcodePreview ? ( <Image src={barcodePreview} alt="معاينة" layout="fill" objectFit="contain" /> ) : (
                          <div className="text-muted-foreground text-center"><Upload className="mx-auto h-8 w-8 mb-1"/><span>رفع باركود</span></div>
                        )}
                        <Input ref={barcodeInputRef} id="barcode-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/png, image/jpeg" onChange={handleBarcodeChange}/>
                      </Card>
                    </div>
                 </div>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSaveGeneral} disabled={isSaving}>
                    {isSaving ? <Loader2 className="ml-2 animate-spin"/> : <Save className="ml-2" />}
                    حفظ الإعدادات العامة
                </Button>
                 <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => openModal('create-admin')}><Lock className="ml-2"/>إنشاء حساب مدير نظام جديد</Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t">
          <Button variant="secondary" onClick={onClose}>رجوع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {alertContent && (
      <AlertDialog open={!!alertContent} onOpenChange={() => setAlertContent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertContent.title}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertContent(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => { alertContent.onConfirm(); setAlertContent(null); }}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
    </>
  );
}

    