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
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InteractiveMap = dynamic(() => import('@/components/map'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-muted"><Loader2 className="h-8 w-8 animate-spin"/></div>
});

interface DeliveryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number, lng: number } | null;
}

export function DeliveryMapModal({ isOpen, onClose, location }: DeliveryMapModalProps) {
  const { toast } = useToast();

  const handleOpenInGoogleMaps = () => {
    if (location) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`, '_blank');
    } else {
        toast({variant: 'destructive', title: 'خطأ', description: 'لا توجد إحداثيات لفتحها.'})
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 bg-primary text-primary-foreground">
          <DialogTitle className="text-xl">موقع التوصيل</DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            خريطة توضح موقع العميل لتسهيل عملية التوصيل.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1">
          {location && (
            <InteractiveMap
              location={location}
              onLocationChange={() => {}} // Non-interactive, so this does nothing
              isDraggable={false}
              isInteractive={true} // Re-enable for zoom
            />
          )}
        </div>
        <DialogFooter className="p-4 border-t gap-2">
            <Button variant="secondary" onClick={handleOpenInGoogleMaps}>
                فتح في خرائط جوجل
            </Button>
            <Button variant="outline" onClick={onClose}>
                إغلاق
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
