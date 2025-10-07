'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, AlertCircle, PlusCircle, Trash2, Edit, Printer, ClipboardPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { NeedsListReceipt } from './needs-list-receipt';
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


interface NeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NeedItem = {
  id: number;
  name: string;
  quantity: string;
  notes: string;
  status: 'required' | 'purchased';
};

type FormState = Partial<Omit<NeedItem, 'id' | 'status'>>;

export function NeedsModal({ isOpen, onClose }: NeedsModalProps) {
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<NeedItem | null>(null);
  const [formState, setFormState] = useState<FormState>({});
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);


  const fetchNeeds = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/needs');
      if (!response.ok) throw new Error('Failed to fetch needs');
      setNeeds(await response.json());
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب قائمة الاحتياجات.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNeeds();
       const fetchLogo = async () => {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const settings = await response.json();
                if (settings.logo_base64) {
                    setLogo(settings.logo_base64);
                }
            }
        } catch (error) {
            console.error("Failed to fetch logo", error);
        }
      };
      fetchLogo();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedNeed) {
      setFormState({
        name: selectedNeed.name,
        quantity: selectedNeed.quantity,
        notes: selectedNeed.notes,
      });
    } else {
      resetForm();
    }
  }, [selectedNeed]);

  const resetForm = () => {
    setFormState({ name: '', quantity: '', notes: '' });
    setSelectedNeed(null);
  };
  
  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState(prev => ({...prev, [field]: value}));
  };

  const handleSave = async () => {
    if (!formState.name || !formState.quantity) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال اسم المتطلب والكمية.' });
      return;
    }
    
    const isEditing = !!selectedNeed;
    const url = isEditing ? `/api/needs/${selectedNeed.id}` : '/api/needs';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save need');
      }
      
      toast({ title: 'تم بنجاح', description: `تم ${isEditing ? 'تعديل' : 'إضافة'} المتطلب.` });
      resetForm();
      fetchNeeds();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ في الحفظ', description: error.message });
    }
  };
  
  const handleDeleteClick = () => {
    if (!selectedNeed) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد متطلب لحذفه.' });
      return;
    }
    setIsAlertOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedNeed) return;
    try {
        await fetch(`/api/needs/${selectedNeed.id}`, { method: 'DELETE' });
        toast({ title: 'تم الحذف بنجاح' });
        resetForm();
        fetchNeeds();
    } catch(e) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف المتطلب.' });
    } finally {
        setIsAlertOpen(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    const item = needs.find(n => n.id === id);
    if (!item) return;
    
    const newStatus = item.status === 'required' ? 'purchased' : 'required';
    try {
        await fetch(`/api/needs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        fetchNeeds();
    } catch(e) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث حالة المتطلب.' });
    }
  };
  
  const handlePrint = () => {
     const node = printRef.current;
    if (node) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>قائمة الاحتياجات</title>');
        printWindow.document.write('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">');
        printWindow.document.write('<style>@page { size: 80mm auto; margin: 0; } body { font-family: "Almarai", sans-serif; direction: rtl; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(node.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  const requiredItems = needs.filter(n => n.status === 'required');
  const purchasedItems = needs.filter(n => n.status === 'purchased');

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-2xl flex items-center gap-2"><ClipboardPlus /> إدارة الاحتياجات</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 grid md:grid-cols-3 gap-6 p-6 overflow-hidden relative">
           {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          {/* Action Panel */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedNeed ? 'تعديل متطلب' : 'إضافة متطلب جديد'}</CardTitle>
                <CardDescription>أضف أو عدّل احتياجاتك من هنا.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="need-name">اسم المتطلب</Label>
                  <Input id="need-name" value={formState.name || ''} onChange={e => handleInputChange('name', e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="need-quantity">الكمية | العدد</Label>
                  <Input id="need-quantity" value={formState.quantity || ''} onChange={e => handleInputChange('quantity', e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="need-notes">ملاحظات</Label>
                  <Input id="need-notes" value={formState.notes || ''} onChange={e => handleInputChange('notes', e.target.value)}/>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white h-14 text-base">
                {selectedNeed ? <Edit className="ml-2"/> : <PlusCircle className="ml-2"/>} 
                {selectedNeed ? 'تعديل' : 'إضافة'}
              </Button>
              <Button onClick={handleDeleteClick} disabled={!selectedNeed} variant="destructive" className="h-14 text-base"><Trash2 className="ml-2"/> حذف</Button>
              <Button onClick={handlePrint} className="bg-yellow-500 hover:bg-yellow-600 text-black h-14 text-base col-span-2"><Printer className="ml-2"/> طباعة</Button>
            </div>
          </div>
          
          {/* List Panel */}
          <div className="md:col-span-2 flex flex-col gap-6 overflow-hidden">
            {/* Required Items */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><AlertCircle /> مطلوب شراؤه ({requiredItems.length})</h3>
              <ScrollArea className="flex-1 bg-card p-3 rounded-lg border">
                <div className="space-y-3">
                  {requiredItems.map(item => (
                    <Card
                      key={item.id}
                      onClick={() => setSelectedNeed(item)}
                      className={cn("flex items-center p-3 transition-colors cursor-pointer bg-background hover:bg-muted", selectedNeed?.id === item.id && "ring-2 ring-primary")}
                    >
                      <div className="flex-1">
                        <p className="font-bold text-lg">{item.name}</p>
                        <p className="text-sm text-muted-foreground">الكمية: {item.quantity}</p>
                        {item.notes && <p className="text-xs text-yellow-600/80">ملاحظات: {item.notes}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleToggleStatus(item.id); }}>
                        <Circle className="h-6 w-6 text-red-500" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Purchased Items */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-green-500 mb-2 flex items-center gap-2"><CheckCircle2 /> تم شراؤه ({purchasedItems.length})</h3>
              <ScrollArea className="flex-1 bg-card p-3 rounded-lg border">
                <div className="space-y-3">
                  {purchasedItems.map(item => (
                     <Card
                      key={item.id}
                      onClick={() => setSelectedNeed(item)}
                      className={cn("flex items-center p-3 transition-colors cursor-pointer bg-background hover:bg-muted text-muted-foreground", selectedNeed?.id === item.id && "ring-2 ring-primary")}
                    >
                      <div className="flex-1">
                        <p className="font-bold text-lg line-through">{item.name}</p>
                        <p className="text-sm line-through">الكمية: {item.quantity}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleToggleStatus(item.id); }}>
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t">
          <Button onClick={resetForm} variant="ghost">مسح النموذج</Button>
          <Button variant="secondary" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
     <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد حذف هذا المتطلب؟ لا يمكن التراجع عن هذا الإجراء.
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
    <div className="hidden">
      <NeedsListReceipt ref={printRef} needs={needs} logo={logo} />
    </div>
    </>
  );
}
