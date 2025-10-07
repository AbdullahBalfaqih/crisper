'use client';

import React, { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface BranchesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone_number: string;
  manager_id: string | null;
};

type User = {
    id: string;
    full_name: string;
};

export function BranchesModal({ isOpen, onClose }: BranchesModalProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formState, setFormState] = useState<Partial<Branch>>({});
  const { toast } = useToast();

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (!res.ok) throw new Error('Failed to fetch branches');
      setBranches(await res.json());
    } catch (e) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب الفروع' });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      setUsers(await res.json());
    } catch (e) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب المستخدمين' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedBranch) {
      setFormState(selectedBranch);
    } else {
      setFormState({});
    }
  }, [selectedBranch]);

  const handleInputChange = (field: keyof Branch, value: string | boolean) => {
    setFormState(prev => ({...prev, [field]: value}));
  };

  const handleSave = async () => {
    if (!formState.name) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'اسم الفرع مطلوب.'});
        return;
    }
    const isEditing = !!selectedBranch;
    const url = isEditing ? `/api/branches/${selectedBranch.id}` : '/api/branches';
    const method = isEditing ? 'PUT' : 'POST';
    try {
        const response = await fetch(url, {
            method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formState)
        });
        if (!response.ok) throw new Error('فشل حفظ الفرع');
        toast({ title: 'تم بنجاح', description: `تم ${isEditing ? 'تعديل' : 'إضافة'} الفرع.` });
        fetchBranches();
        setFormState({});
        setSelectedBranch(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: e.message });
    }
  };
  
  const handleDelete = async () => {
      if (!selectedBranch) return;
      try {
          const response = await fetch(`/api/branches/${selectedBranch.id}`, {method: 'DELETE'});
          if (!response.ok) throw new Error('فشل حذف الفرع');
          toast({ title: 'تم الحذف' });
          fetchBranches();
          setFormState({});
          setSelectedBranch(null);
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'خطأ', description: e.message });
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-2xl">إدارة الأفرع</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
          {/* Form */}
          <div className="bg-card p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-center">
              {/* Row 1 */}
              <div className="space-y-1">
                <Label htmlFor="branch-name">اسم الفرع</Label>
                <Input id="branch-name" value={formState.name || ''} onChange={e => handleInputChange('name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch-city">مدينة الفرع</Label>
                <Input id="branch-city" value={formState.city || ''} onChange={e => handleInputChange('city', e.target.value)} />
              </div>
               <div className="space-y-1">
                <Label htmlFor="branch-address">عنوان الفرع</Label>
                <Input id="branch-address" value={formState.address || ''} onChange={e => handleInputChange('address', e.target.value)} />
              </div>
               <div className="space-y-1">
                <Label htmlFor="branch-phone">هاتف الفرع</Label>
                <Input id="branch-phone" value={formState.phone_number || ''} onChange={e => handleInputChange('phone_number', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch-manager">مدير الفرع</Label>
                 <Select value={formState.manager_id || ''} onValueChange={value => handleInputChange('manager_id', value)}>
                    <SelectTrigger><SelectValue placeholder="اختر مدير..." /></SelectTrigger>
                    <SelectContent>
                        {users.map(user => <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end items-center gap-4 mt-6">
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>{selectedBranch ? 'تعديل فرع' : 'إضافة فرع'}</Button>
                {selectedBranch && <Button variant="destructive" onClick={handleDelete}>حذف فرع</Button>}
                <Button variant="outline" onClick={() => setSelectedBranch(null)}>جديد</Button>
            </div>
          </div>
          
          {/* Table */}
          <div className="flex-1 rounded-lg overflow-hidden border">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary/90">
                    <TableHead className="text-primary-foreground text-center">اسم الفرع</TableHead>
                    <TableHead className="text-primary-foreground text-center">المدينة</TableHead>
                    <TableHead className="text-primary-foreground text-center">العنوان</TableHead>
                    <TableHead className="text-primary-foreground text-center">رقم الهاتف</TableHead>
                    <TableHead className="text-primary-foreground text-center">اسم المدير</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch)}
                      className={cn('cursor-pointer hover:bg-muted/50', selectedBranch?.id === branch.id && 'bg-primary/20')}
                    >
                      <TableCell className="text-center">{branch.name}</TableCell>
                      <TableCell className="text-center">{branch.city}</TableCell>
                      <TableCell className="text-center">{branch.address}</TableCell>
                      <TableCell className="text-center">{branch.phone_number}</TableCell>
                      <TableCell className="text-center">{users.find(u => u.id === branch.manager_id)?.full_name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="p-4 bg-card border-t">
          <Button variant="secondary" onClick={onClose}>رجوع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
