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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast.tsx';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { Supplier } from './purchases-modal';

interface SupplierManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSupplierUpdate: () => void;
}

export function SupplierManagementModal({ isOpen, onClose, onSupplierUpdate }: SupplierManagementModalProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [formState, setFormState] = useState<Partial<Omit<Supplier, 'id'>>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            const fetchSuppliers = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch('/api/suppliers');
                    if (!res.ok) throw new Error('Failed to fetch suppliers');
                    setSuppliers(await res.json());
                } catch (error) {
                    toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب الموردين.' });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSuppliers();
        } else {
            setSelectedSupplier(null);
            setFormState({});
        }
    }, [isOpen, toast]);

    useEffect(() => {
        setFormState(selectedSupplier ? { name: selectedSupplier.name, phone_number: selectedSupplier.phone_number, address: selectedSupplier.address, contact_person: selectedSupplier.contact_person } : { name: '' });
    }, [selectedSupplier]);

    const handleSave = async () => {
        if(!formState.name) {
            toast({variant: 'destructive', title: 'خطأ', description: 'اسم المورد مطلوب.'});
            return;
        }
        
        setIsLoading(true);
        const isEditing = !!selectedSupplier;
        const url = isEditing ? `/api/suppliers/${selectedSupplier.id}` : '/api/suppliers';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formState)});
            if(!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save supplier');
            }
            toast({title: isEditing ? 'تم التحديث' : 'تمت الإضافة'});
            onSupplierUpdate(); // Call the callback to refetch data in the parent
            
            // Re-fetch local list and update selection
            const res = await fetch('/api/suppliers');
            const updatedSuppliers = await res.json();
            setSuppliers(updatedSuppliers);
            const savedSupplier = await response.json();
            setSelectedSupplier(updatedSuppliers.find((s: Supplier) => s.id === savedSupplier.id) || null);

        } catch (error: any) {
            toast({variant: 'destructive', title: 'خطأ في الحفظ', description: error.message});
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleDelete = async () => {
        if (selectedSupplier) {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/suppliers/${selectedSupplier.id}`, {method: 'DELETE'});
                 if(!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete supplier');
                }
                toast({title: 'تم الحذف'});
                onSupplierUpdate();
                setSuppliers(prev => prev.filter(s => s.id !== selectedSupplier.id));
                setSelectedSupplier(null);
            } catch(e: any) {
                toast({variant: 'destructive', title: 'خطأ في الحذف', description: e.message});
            } finally {
                setIsLoading(false);
            }
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                {isLoading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                <DialogHeader className="p-4 bg-primary text-primary-foreground">
                    <DialogTitle className="text-2xl">إدارة الموردين</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-4">
                    <div className="flex flex-col gap-4">
                        <h4 className="font-semibold">قائمة الموردين</h4>
                        <ScrollArea className="h-72 border rounded-md">
                            {suppliers.map(s => (
                                <div key={s.id} onClick={() => setSelectedSupplier(s)} className={cn("p-3 cursor-pointer hover:bg-muted", selectedSupplier?.id === s.id && "bg-muted font-bold")}>{s.name}</div>
                            ))}
                        </ScrollArea>
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold">{selectedSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h4>
                        <div className="space-y-2"><Label>اسم المورد</Label><Input value={formState.name || ''} onChange={e => setFormState(p => ({...p, name: e.target.value}))}/></div>
                        <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={formState.phone_number || ''} onChange={e => setFormState(p => ({...p, phone_number: e.target.value}))}/></div>
                        <div className="space-y-2"><Label>العنوان</Label><Input value={formState.address || ''} onChange={e => setFormState(p => ({...p, address: e.target.value}))}/></div>
                        <div className="space-y-2"><Label>اسم جهة الاتصال</Label><Input value={formState.contact_person || ''} onChange={e => setFormState(p => ({...p, contact_person: e.target.value}))}/></div>
                     </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button onClick={() => setSelectedSupplier(null)} variant="secondary">مورد جديد</Button>
                    <div className="flex-grow"></div>
                    {selectedSupplier && <Button onClick={handleDelete} variant="destructive">حذف المورد المحدد</Button>}
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">حفظ التغييرات</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
