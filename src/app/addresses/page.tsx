'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, MapPin, Edit, Home, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
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
import { cn } from '@/lib/utils';


type Address = {
  id: string;
  address_name: string;
  address_details: string;
  latitude: number;
  longitude: number;
};

export default function AddressesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  const isCheckoutFlow = searchParams.get('flow') === 'checkout';

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/addresses?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch addresses");
      const data = await res.json();
      setAddresses(data);
      if (data.length > 0 && !selectedAddressId) {
        setSelectedAddressId(data[0].id);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب العناوين المحفوظة.' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, selectedAddressId]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user, fetchAddresses]);

  const handleContinue = () => {
    if (!selectedAddressId) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى اختيار عنوان توصيل للمتابعة.' });
      return;
    }
    router.push(`/checkout?type=delivery&addressId=${selectedAddressId}`);
  };

  const handleDelete = async () => {
    if (!addressToDelete) return;
    try {
        await fetch(`/api/addresses/${addressToDelete}`, { method: 'DELETE' });
        toast({ description: 'تم حذف العنوان بنجاح.' });
        fetchAddresses();
        if (selectedAddressId === addressToDelete) {
            setSelectedAddressId(null);
        }
    } catch (e) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف العنوان.' });
    } finally {
        setAddressToDelete(null);
    }
  };

  return (
    <>
    <div className="bg-background min-h-screen font-body text-foreground pb-40">
      <div className="container mx-auto max-w-lg p-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href={isCheckoutFlow ? "/cart" : "/account"} className="p-2">
            <ArrowRight size={24} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            عنوان التوصيل
            <MapPin />
          </h1>
          <Button asChild variant="ghost" size="icon">
            <Link href="/addresses/add">
                <Plus />
            </Link>
          </Button>
        </header>
        
        {isLoading ? (
            <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : addresses.length === 0 ? (
             <div className="text-center text-muted-foreground py-10">
                <p>لم تقم بإضافة أي عناوين بعد.</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/addresses/add">أضف عنوان جديد</Link>
                </Button>
             </div>
        ) : (
            <div className="space-y-4">
                {addresses.map(address => (
                    <Card 
                      key={address.id}
                      className={cn("cursor-pointer transition-all", selectedAddressId === address.id ? "border-primary ring-2 ring-primary" : "border-border")}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                        <CardContent className="p-4 flex items-start gap-4">
                            <Home className="h-8 w-8 text-primary mt-1"/>
                            <div className="flex-1">
                                <p className="font-bold text-lg">{address.address_name}</p>
                                <p className="text-muted-foreground">{address.address_details}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); router.push(`/addresses/edit/${address.id}`)}}>
                                    <Edit className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); setAddressToDelete(address.id)}}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>

      {isCheckoutFlow && (
        <footer className="fixed bottom-16 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 max-w-lg mx-auto md:bottom-0">
            <Button 
                className="w-full h-14 text-lg"
                onClick={handleContinue}
                disabled={addresses.length === 0 || !selectedAddressId}
            >
                متابعة إلى الدفع
            </Button>
        </footer>
      )}
    </div>
    
    <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                    هل أنت متأكد أنك تريد حذف هذا العنوان؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAddressToDelete(null)}>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
