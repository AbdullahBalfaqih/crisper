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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, PartyPopper, UserCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.tsx';

interface RaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Customer = { 
  id: string; 
  full_name: string;
  username: string; 
  email: string; 
  role: 'system_admin' | 'employee' | 'customer';
};


export function RaffleModal({ isOpen, onClose }: RaffleModalProps) {
  const [winner, setWinner] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('/api/users');
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                const allUsers: Customer[] = await response.json();
                // Filter for customers only
                const customerUsers = allUsers.filter(user => user.role === 'customer');
                setCustomers(customerUsers);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'خطأ',
                    description: 'فشل في جلب قائمة العملاء.',
                });
            }
        };
        fetchCustomers();
    }
  }, [isOpen, toast]);

  const handleDraw = () => {
    setIsDrawing(true);
    setWinner(null);

    setTimeout(() => {
      if (customers.length === 0) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'لا يوجد عملاء في القائمة لإجراء السحب.',
        });
        setIsDrawing(false);
        return;
      }
      const randomIndex = Math.floor(Math.random() * customers.length);
      const newWinner = customers[randomIndex];
      setWinner(newWinner);
      setIsDrawing(false);
      toast({
        title: '🎉 تهانينا! 🎉',
        description: `الفائز هو ${newWinner.full_name}!`,
      });
    }, 2000); // Simulate a drawing animation
  };
  
  const handleSaveResult = () => {
      if (!winner) return;
      // Here you would typically save the winner to a log or database
      toast({
          title: "تم حفظ النتيجة",
          description: `تم حفظ ${winner.full_name} كفائز في السحب.`
      })
      handleClose();
  }

  const handleClose = () => {
    setWinner(null);
    setIsDrawing(false);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Ticket className="text-primary" />
            السحب العشوائي للعملاء
          </DialogTitle>
          <DialogDescription>
            اضغط على "ابدأ السحب" لاختيار فائز عشوائي من قائمة العملاء.
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 flex items-center justify-center">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle>الفائز في السحب</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[180px] gap-4">
                    {isDrawing && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground">
                            <PartyPopper className="h-12 w-12 animate-bounce text-primary" />
                            <p>جاري السحب...</p>
                        </div>
                    )}
                    {!isDrawing && winner && (
                         <div className="flex flex-col items-center gap-4 animate-in fade-in-50 zoom-in-95">
                            <UserCircle2 className="h-16 w-16 text-accent"/>
                            <div className="space-y-1">
                                <p className="text-xl font-bold">{winner.full_name}</p>
                                <p className="text-sm text-muted-foreground">@{winner.username}</p>
                                <p className="text-xs text-muted-foreground font-mono">{winner.role}</p>
                            </div>
                         </div>
                    )}
                    {!isDrawing && !winner && (
                        <div className="text-muted-foreground">
                            <p>في انتظار بدء السحب</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        <DialogFooter className="flex-row justify-between w-full">
            <Button variant="ghost" onClick={handleClose}>الرجوع</Button>
            <div className="flex gap-2">
                {!isDrawing && winner && (
                    <>
                        <Button variant="outline" onClick={handleSaveResult}>حفظ النتيجة</Button>
                        <Button variant="secondary" onClick={handleDraw}>السحب مرة أخرى</Button>
                    </>
                )}
                <Button onClick={handleDraw} disabled={isDrawing}>
                    {isDrawing ? 'جاري السحب...' : 'ابدأ السحب'}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
