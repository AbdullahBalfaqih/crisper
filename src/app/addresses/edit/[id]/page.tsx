
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowRight, MapPin, LocateFixed, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';

const InteractiveMap = dynamic(() => import('@/components/map'), {
  ssr: false,
});


export default function EditAddressPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [addressDetails, setAddressDetails] = useState('');
  const [addressName, setAddressName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchAddress = async () => {
        setIsFetching(true);
        try {
            const response = await fetch(`/api/addresses/${id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch address details");
            }
            const data = await response.json();
            setAddressName(data.address_name);
            setAddressDetails(data.address_details);
            setLocation({ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) });
        } catch(e) {
            toast({variant: "destructive", title: "خطأ", description: "فشل في جلب بيانات العنوان."})
            router.push('/addresses');
        } finally {
            setIsFetching(false);
        }
    };
    
    fetchAddress();

  }, [id, router, toast]);


  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      (geoPosition) => {
        const { latitude, longitude } = geoPosition.coords;
        setLocation({ lat: latitude, lng: longitude });
        toast({
          title: 'تم تحديد موقعك بنجاح',
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          variant: 'destructive',
          title: 'خطأ في تحديد الموقع',
          description: 'لم نتمكن من الوصول إلى موقعك الحالي. يرجى التأكد من تفعيل خدمات الموقع.',
        });
      }
    );
  };
  
  const handleSaveAddress = async () => {
    if (!location || !addressDetails || !addressName) {
        toast({title: "بيانات ناقصة", description: "يرجى ملء جميع الحقول وتحديد الموقع على الخريطة.", variant: "destructive"});
        return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressName: addressName,
          addressDetails: addressDetails,
          latitude: location.lat,
          longitude: location.lng
        })
      });

      if (!response.ok) {
        throw new Error('فشل تحديث العنوان.');
      }

      toast({
          title: 'تم الحفظ',
          description: 'تم تحديث العنوان بنجاح.',
      });
      router.push('/addresses');

    } catch (e) {
      toast({title: 'خطأ', description: 'حدث خطأ أثناء تحديث العنوان.', variant: 'destructive'});
    } finally {
      setIsLoading(false);
    }
  };

  const coordinatesString = useMemo(() => {
    if (!location) return '';
    return `${Number(location.lat).toFixed(4)}, ${Number(location.lng).toFixed(4)}`;
  }, [location]);

  if (isFetching) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <Link href="/addresses" className="p-2">
          <ArrowRight size={24} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          تعديل العنوان
          <MapPin />
        </h1>
        <div className="w-8"></div>
      </header>
      
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
        {/* Map View */}
        <div className="md:w-1/2 h-64 md:h-auto relative">
          <InteractiveMap
            location={location}
            onLocationChange={setLocation}
          />
          <div className="absolute top-4 left-4 z-[1000]">
            <Button variant="secondary" onClick={handleLocateMe}>
                <LocateFixed className="ml-2"/>
                استخدم موقعي الحالي
            </Button>
          </div>
        </div>
        
        {/* Form Section */}
        <ScrollArea className="md:w-1/2">
            <div className="p-4 bg-card h-full">
                <CardContent className="p-0 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="coordinates" className="text-right w-full block">الإحداثيات (خط العرض، خط الطول)</Label>
                        <Input id="coordinates" value={coordinatesString} readOnly dir="ltr" className="bg-muted"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address-details" className="text-right w-full block">تفاصيل العنوان (الشارع، المبنى، شقة رقم..)</Label>
                        <Input id="address-details" placeholder="مثال: شارع الجزائر، عمارة الأمل، شقة 5" value={addressDetails} onChange={e => setAddressDetails(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address-name" className="text-right w-full block">اسم العنوان (مثال: المنزل، العمل)</Label>
                        <Input id="address-name" placeholder="المنزل" value={addressName} onChange={e => setAddressName(e.target.value)} />
                    </div>
                    <Button className="w-full h-12 text-lg !mt-6" onClick={handleSaveAddress} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin ml-2"/> : <Save className="ml-2"/>}
                        {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </Button>
                </CardContent>
            </div>
        </ScrollArea>
      </div>
    </div>
  );
}
