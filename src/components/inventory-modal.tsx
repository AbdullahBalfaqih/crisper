'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast.tsx';
import { format } from 'date-fns';
import type { InventoryItem } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { generateInventoryHtmlReport } from '@/app/export/actions';
import { FileDown, Loader2 } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InventoryModal({ isOpen, onClose }: InventoryModalProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantityInput, setQuantityInput] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchInventory = async () => {
      setIsLoading(true);
      try {
          const response = await fetch('/api/inventory');
          if (!response.ok) throw new Error('Failed to fetch inventory data');
          const data = await response.json();
          setInventory(data.map((item: any) => ({...item, quantity: parseInt(item.quantity)})));
      } catch (error) {
          toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات المخزون.' });
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedItem) {
      setQuantityInput(selectedItem.quantity);
    } else {
      setQuantityInput(0);
    }
  }, [selectedItem]);
  
  const handleUpdateQuantity = async () => {
    if (!selectedItem) {
        toast({ variant: "destructive", title: "خطأ", description: "يرجى تحديد منتج لتعديل كميته."});
        return;
    }

    try {
        const response = await fetch(`/api/inventory/${selectedItem.productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: quantityInput })
        });
        if (!response.ok) throw new Error('Failed to update quantity.');

        toast({ title: "تم التحديث", description: `تم تحديث كمية ${selectedItem.productName}.` });
        fetchInventory(); // Refetch data
    } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث الكمية.' });
    }
  }
  
  const handleExport = async () => {
    toast({ title: "جاري التصدير...", description: "سيتم تصدير بيانات المخزون." });
    try {
      const reportHtml = await generateInventoryHtmlReport(inventory);
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory-report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل تقرير المخزون.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء تقرير HTML.' });
    }
  }

  const handleClear = async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/inventory', { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to clear inventory');
        toast({ title: "تم التفريغ", description: "تم تصفير كميات جميع المنتجات في المخزون." });
        fetchInventory();
    } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل تصفير المخزون." });
    } finally {
        setIsLoading(false);
    }
  }

  const totalInventoryValue = inventory.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl p-4">
        <DialogHeader className="bg-primary p-4 -m-4 mb-4 text-primary-foreground">
            <DialogTitle className="text-2xl text-primary-foreground">إدارة المخزون</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-12 gap-4 pt-4">
          {/* Action Panel */}
          <div className="md:col-span-3 flex flex-col gap-4">
             <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor='quantity-input' className="text-center block">الكمية المحددة للمنتج: {selectedItem?.productName}</Label>
                        <Input
                            id='quantity-input' 
                            type="number" 
                            value={quantityInput}
                            onChange={(e) => setQuantityInput(Number(e.target.value))}
                            className="h-12 text-center text-2xl"
                            disabled={!selectedItem}
                        />
                    </div>
                    <Button onClick={handleUpdateQuantity} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white" disabled={!selectedItem}>تعديل الكمية</Button>
                </CardContent>
             </Card>
             <Card>
                 <CardContent className="p-4 flex flex-col gap-2">
                    <Button onClick={handleExport} className="w-full bg-primary hover:bg-primary/90"><FileDown className="ml-2" />تصدير المخزون</Button>
                    <Button onClick={handleClear} variant="destructive" className="w-full">تفريغ المخزون</Button>
                 </CardContent>
             </Card>
          </div>
          
          {/* Table */}
          <div className="md:col-span-9 flex flex-col bg-card p-2 rounded-lg border relative">
             {isLoading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              <ScrollArea className="flex-1">
                  <Table>
                      <TableHeader>
                          <TableRow className="hover:bg-muted/50 bg-primary">
                              <TableHead className="text-center text-primary-foreground">اسم المنتج</TableHead>
                              <TableHead className="text-center text-primary-foreground">الكمية المتاحة</TableHead>
                              <TableHead className="text-center text-primary-foreground">تاريخ التحديث</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                      {inventory.map((item) => (
                          <TableRow 
                            key={item.inventoryId} 
                            onClick={() => setSelectedItem(item)}
                            className={cn('cursor-pointer', selectedItem?.inventoryId === item.inventoryId && 'bg-primary/20')}
                          >
                              <TableCell className="text-center">{item.productName}</TableCell>
                              <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                              <TableCell className="text-center">{format(new Date(item.lastUpdated), "yyyy/MM/dd hh:mm a")}</TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
              </ScrollArea>
          </div>
        </div>

        <DialogFooter className="mt-4 p-4 bg-card rounded-lg border">
           <div className="flex justify-between items-center w-full">
             <Button onClick={onClose} variant="ghost" className="h-12 px-8">رجوع</Button>
             <div className="text-xl">
                قيمة المنتجات في المخزون: <span className="font-bold text-green-500">{totalInventoryValue.toLocaleString('ar-SA')} ر.ي</span>
             </div>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
