
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, UserPlus, Edit, Trash2, FileDown, RefreshCw, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';
import type { ModalType } from './app-container';
import { generateAccountsHtmlReport } from '@/app/export/actions';

type User = { 
  id: string; 
  full_name: string;
  username: string; 
  email: string;
  phone_number: string;
  role: 'system_admin' | 'employee' | 'customer';
};

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  openModal: (modal: ModalType) => void;
}

const CURRENT_USER_ROLE = 'مدير نظام';

type ActionType = 'add' | 'edit';
type FormState = Partial<User> & { password?: string };

export function AccountsModal({ isOpen, onClose, openModal }: AccountsModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentAction, setCurrentAction] = useState<ActionType>('add');

  const [formState, setFormState] = useState<FormState>({});

  const { toast } = useToast();
  
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Network response was not ok');
      const allUsers = await response.json();
      setUsers(allUsers);
    } catch (error) {
      toast({ variant: 'destructive', title: 'فشل في جلب المستخدمين' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      setSelectedUser(null);
      setSearchQuery('');
      setCurrentAction('add');
      resetForm();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (selectedUser) {
      setCurrentAction('edit');
      setFormState({
        ...selectedUser,
        password: '' // Don't pre-fill password
      });
    } else {
      setCurrentAction('add');
      resetForm();
    }
  }, [selectedUser]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };
  
  const handleAddNew = () => {
    setSelectedUser(null);
  }

  const resetForm = () => {
    setFormState({ id: '', full_name: '', username: '', email: '', phone_number: '', role: 'customer', password: '' });
  };
  
  const handleFormChange = (value: string, field: keyof FormState) => {
      setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const isEditing = !!selectedUser;
      if (!isEditing && !formState.password) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'كلمة المرور مطلوبة عند إنشاء مستخدم جديد.' });
        return;
      }
      
      const url = isEditing ? `/api/users/${selectedUser.id}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formState),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'An error occurred');
        }
        
        toast({ title: 'تم بنجاح', description: `تم ${isEditing ? 'تحديث' : 'إضافة'} المستخدم بنجاح.` });
        
        await fetchUsers();
        handleAddNew();

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
      }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
        const response = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'An error occurred');
        }

        toast({
          title: 'تم الحذف بنجاح',
          description: `تم حذف المستخدم ${userToDelete.full_name}.`
        });
        await fetchUsers();
        if (selectedUser?.id === userToDelete.id) {
            setSelectedUser(null);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ في الحذف', description: error.message });
    } finally {
        setIsAlertOpen(false);
        setUserToDelete(null);
    }
  };

  const handleExport = async () => {
    toast({ title: 'جاري إنشاء التقرير...', description: 'يتم تجهيز تقرير HTML.' });
    try {
      const reportHtml = await generateAccountsHtmlReport(filteredUsers as any);
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'accounts-report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل التقرير.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone_number || '').includes(searchQuery)
  );
  
  const getActionTitle = () => {
      switch(currentAction) {
          case 'add': return 'إضافة مستخدم جديد';
          case 'edit': return 'تعديل بيانات المستخدم';
          default: return 'إدارة الحسابات';
      }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>إدارة الحسابات</DialogTitle>
            <DialogDescription>
              إضافة، تعديل، وحذف حسابات المستخدمين.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-6 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                {/* Form Panel */}
                <div className="md:col-span-1 flex flex-col">
                  <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>{getActionTitle()}</CardTitle>
                        {currentAction === 'edit' && <CardDescription>المستخدم المحدد: {selectedUser?.full_name}</CardDescription>}
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        <ScrollArea className="h-full -mx-6 px-6">
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">الاسم الكامل</Label>
                                    <Input id="name" value={formState.full_name || ''} onChange={(e) => handleFormChange(e.target.value, 'full_name')} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="username">اسم المستخدم</Label>
                                    <Input id="username" value={formState.username || ''} onChange={(e) => handleFormChange(e.target.value, 'username')} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">رقم الهاتف</Label>
                                    <Input id="phone" value={formState.phone_number || ''} onChange={(e) => handleFormChange(e.target.value, 'phone_number')} required/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">البريد الإلكتروني</Label>
                                    <Input id="email" type="email" value={formState.email || ''} onChange={(e) => handleFormChange(e.target.value, 'email')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">كلمة المرور</Label>
                                    <Input id="password" type="password" placeholder={currentAction === 'edit' ? 'اتركه فارغاً لعدم التغيير' : 'كلمة المرور مطلوبة'} value={formState.password || ''} onChange={(e) => handleFormChange(e.target.value, 'password')} required={currentAction === 'add'} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">دور المستخدم</Label>
                                    <Select value={formState.role} onValueChange={(value) => handleFormChange(value, 'role')}>
                                        <SelectTrigger id="role">
                                            <SelectValue placeholder="اختر دور المستخدم" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="customer">عميل</SelectItem>
                                            <SelectItem value="employee">موظف</SelectItem>
                                            <SelectItem value="system_admin">مدير نظام</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" className="w-full">
                                {currentAction === 'add' ? 'إضافة الحساب' : 'تحديث الحساب'}
                                </Button>
                            </form>
                        </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Main content - Users Table */}
                <div className="md:col-span-2 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        placeholder="بحث في القائمة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        />
                    </div>
                    <Button variant="outline" onClick={handleAddNew}><UserPlus className="ml-2 h-4 w-4" /> إضافة</Button>
                    <Button variant="outline" onClick={() => openModal('raffle')}><Ticket className="ml-2 h-4 w-4" /> سحب عشوائي</Button>
                    <Button variant="outline" onClick={handleExport}><FileDown className="ml-2 h-4 w-4" /> تصدير</Button>
                    <Button variant="outline" onClick={fetchUsers}><RefreshCw className="ml-2 h-4 w-4" /> تحديث</Button>
                  </div>
                  <Card className="flex-1 flex flex-col">
                    <CardContent className="p-0 flex-1">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-primary">
                              <TableHead className="text-primary-foreground text-center">اسم المستخدم</TableHead>
                              <TableHead className="text-primary-foreground text-center">الاسم</TableHead>
                              <TableHead className="text-primary-foreground text-center">البريد الإلكتروني</TableHead>
                              <TableHead className="text-primary-foreground text-center">رقم الهاتف</TableHead>
                              <TableHead className="text-primary-foreground text-center">الدور</TableHead>
                              <TableHead className="text-primary-foreground text-center">إجراء</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((user) => (
                              <TableRow
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                className={cn('cursor-pointer', selectedUser?.id === user.id && 'bg-muted/80')}
                              >
                                <TableCell className="font-medium text-center">{user.username}</TableCell>
                                <TableCell className="text-center">{user.full_name}</TableCell>
                                <TableCell className="text-center">{user.email}</TableCell>
                                <TableCell className="text-center">{user.phone_number}</TableCell>
                                <TableCell className="text-center">{user.role}</TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleDeleteClick(user)}}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
