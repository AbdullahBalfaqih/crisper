'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Printer, Share2 } from 'lucide-react';
import type { OrderItem } from '@/lib/types';
import { PrintableReceipt } from './printable-receipt';
import { KitchenReceipt } from './kitchen-receipt';
import type { PaymentMethod } from './payment-dialog';
import type { Category } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { toPng } from 'html-to-image';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  discount: number;
  paymentMethod: PaymentMethod;
  specialPrintCategoryId: string | null;
  orderDetails: any;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  cashierName: string;
  paymentMethod: PaymentMethod;
  logoUrl: string | null;
  barcodeUrl: string | null;
}

const PrintComponent = React.forwardRef<HTMLDivElement, { orderItems: OrderItem[], discount: number, receiptData: ReceiptData, specialPrintCategoryId: string | null }>(
  ({ orderItems, discount, receiptData, specialPrintCategoryId }, ref) => {
    
    const hasSpecialCategoryItem = specialPrintCategoryId && orderItems.some(item => item.categoryId === specialPrintCategoryId);
    const hasOtherCategoryItem = orderItems.some(item => item.categoryId !== specialPrintCategoryId);

    const shouldPrintSpecialReceipt = hasSpecialCategoryItem && hasOtherCategoryItem;

    const specialItems = shouldPrintSpecialReceipt 
        ? orderItems.filter(item => item.categoryId === specialPrintCategoryId) 
        : [];
        
    const regularItems = shouldPrintSpecialReceipt
        ? orderItems.filter(item => item.categoryId !== specialPrintCategoryId)
        : orderItems;

    return (
      <div ref={ref}>
        <div style={{ pageBreakAfter: 'always' }}>
          <KitchenReceipt orderItems={regularItems} {...receiptData} logoUrl={receiptData.logoUrl} />
        </div>
        
        {shouldPrintSpecialReceipt && (
           <div style={{ pageBreakAfter: 'always' }}>
              <KitchenReceipt orderItems={specialItems} {...receiptData} logoUrl={receiptData.logoUrl} />
           </div>
        )}

        <PrintableReceipt orderItems={orderItems} discount={discount} {...receiptData} />
      </div>
    );
  }
);
PrintComponent.displayName = 'PrintComponent';

export function ReceiptModal({
  isOpen,
  onClose,
  orderItems,
  discount,
  paymentMethod,
  specialPrintCategoryId: propSpecialPrintCategoryId,
  orderDetails,
}: ReceiptModalProps) {
  const { user } = useAuth();
  const componentRef = useRef<HTMLDivElement>(null);
  const customerReceiptRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [specialPrintCategoryId, setSpecialPrintCategoryId] = useState<string | null>(propSpecialPrintCategoryId);
  const { toast } = useToast();

   useEffect(() => {
    if (isOpen) {
      const now = new Date();
      
      const fetchSettings = async () => {
          let logoUrl = null;
          let barcodeUrl = null;
          try {
              const res = await fetch('/api/settings');
              if (res.ok) {
                  const settings = await res.json();
                  setSpecialPrintCategoryId(settings.special_print_category_id || null);
                  logoUrl = settings.logo_base64 || null;
                  barcodeUrl = settings.barcode_base64 || null;
              }
          } catch(e) { 
              console.error("Failed to fetch settings for receipt");
          } finally {
              setReceiptData({
                receiptNumber: orderDetails?.id.toString() || 'N/A',
                date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(now),
                time: new Intl.DateTimeFormat('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true }).format(now),
                cashierName: user?.full_name || 'موظف الكاشير',
                paymentMethod: paymentMethod,
                logoUrl: logoUrl,
                barcodeUrl: barcodeUrl
              });
          }
      }
      fetchSettings();

    }
  }, [isOpen, paymentMethod, orderDetails, user]);

  const handlePrint = () => {
    const node = componentRef.current;
    if (node) {
      const printContent = node.innerHTML;
      const printWindow = window.open('', '_blank');

      if (printWindow) {
          printWindow.document.write('<html><head><title>Print</title>');
          
          printWindow.document.write(`
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Cairo:wght@400;700&display=swap" rel="stylesheet">
          `);

          printWindow.document.write('<style>');
          printWindow.document.write(`
              body { 
                  font-family: 'Cairo', 'Almarai', sans-serif;
                  margin: 0; 
                  -webkit-print-color-adjust: exact; 
                  print-color-adjust: exact; 
              }
              @page { 
                  size: 80mm auto; 
                  margin: 0;
              }
          `);
          printWindow.document.write('</style></head><body>');
          printWindow.document.write(printContent);
          printWindow.document.write('</body></html>');
          printWindow.document.close();

          printWindow.onload = () => {
              printWindow.focus();
              printWindow.print();
              printWindow.close();
          };
      }
    }
  };

  const handleShare = async () => {
    if (!customerReceiptRef.current) {
        toast({variant: 'destructive', title: 'خطأ', description: 'لا يمكن إنشاء صورة الفاتورة.'});
        return;
    }

    try {
        const dataUrl = await toPng(customerReceiptRef.current, { cacheBust: true, pixelRatio: 2 });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `receipt-${receiptData?.receiptNumber}.png`, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `فاتورة ${receiptData?.receiptNumber}`,
                text: 'شكراً لطلبك من مطعمنا!',
            });
        } else {
             // Fallback for browsers that don't support sharing files
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `receipt-${receiptData?.receiptNumber}.png`;
            link.click();
            toast({title: 'تم تنزيل الفاتورة', description: 'لا يدعم متصفحك المشاركة المباشرة.'});
        }
    } catch (err) {
        console.error('oops, something went wrong!', err);
        toast({variant: 'destructive', title: 'خطأ', description: 'فشل إنشاء ومشاركة صورة الفاتورة.'});
    }
  };


  if (!receiptData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>الإيصال</DialogTitle>
        </DialogHeader>
        <div className="my-4 overflow-auto bg-gray-200 p-4 flex justify-center rounded-md">
          <div className="scale-95" ref={customerReceiptRef}>
             <PrintableReceipt orderItems={orderItems} discount={discount} {...receiptData} />
          </div>
        </div>
        
        <div className="hidden">
           {receiptData && <PrintComponent ref={componentRef} orderItems={orderItems} discount={discount} receiptData={receiptData} specialPrintCategoryId={specialPrintCategoryId} />}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleShare} className="bg-green-600 hover:bg-green-700">
                <Share2 className="ml-2 h-4 w-4" />
                مشاركة
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
