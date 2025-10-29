'use client';

import React from 'react';
import type { OrderItem } from '@/lib/types';
import type { PaymentMethod } from './payment-dialog';

interface PrintableReceiptProps {
  orderItems: OrderItem[];
  discount: number;
  receiptNumber: string;
  date: string;
  time: string;
  cashierName: string;
  paymentMethod: PaymentMethod;
  logoUrl: string | null;
  barcodeUrl: string | null;
}

export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(
  ({ orderItems, discount, receiptNumber, date, time, cashierName, paymentMethod, logoUrl, barcodeUrl }, ref) => {
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = subtotal - discount;

    const receiptStyles = `
        .receipt-container-customer {
            width: 302px;
            padding: 10px;
            background: white;
            color: black;
            font-family: 'Almarai', sans-serif;
            direction: rtl;
            box-sizing: border-box;
            font-size: 14px;
            line-height: 1.4;
        }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .text-lg { font-size: 1.125rem; }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-3xl { font-size: 1.875rem; }
        .my-1 { margin-top: 0; margin-bottom: 0; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .w-full { width: 100%; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .flex { display: flex; }
        .tracking-wider { letter-spacing: 0.05em; }
        .header-section { line-height: 1; margin-bottom: 5px; }
        .header-section p { margin: 0; line-height: 1.2;}
        .solid-hr {
            border: none;
            border-top: 1px solid #000;
            margin: 5px 0;
            height: 1px;
            overflow: hidden;
            text-align: center;
        }
        .solid-hr:before {
          content: '____________________________';
          font-size: 10px;
          position: relative;
          top: -0.4em;
        }
        .details-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap-x: 0.75rem;
            font-size: 14px;
            line-height: 1.6;
        }
        .details-grid > div { padding: 0; }
        .details-grid > div:nth-child(odd) { font-weight: bold; }
        .details-grid > div:nth-child(even) { text-align: left; }
        .items-grid {
            display: grid;
            grid-template-columns: 1fr 50px 70px;
            text-align: right;
            font-size: 14px;
            gap-x: 4px;
            padding: 2px 0;
        }
        .items-grid .header { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; font-size: 15px;}
        .items-grid .col-1 { grid-column: 1; }
        .items-grid .col-2 { grid-column: 2; text-align: center;}
        .items-grid .col-3 { grid-column: 3; text-align: left;}
        .totals-section { font-size: 15px; line-height: 1.6; }
        .totals-section > div { padding: 2px 0; }
        .grand-total { font-size: 1.5rem; font-weight: bold; }
        .logo-img { max-height: 60px; margin: 0 auto 5px; }
        .barcode-section { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 5px; }
        .barcode-img { width: 150px; height: auto; }
        .item-notes { font-size: 10px; color: #555; padding-right: 0.75rem; }
    `;

    return (
      <div ref={ref}>
        <style>{receiptStyles}</style>
        <div className="receipt-container-customer">
            <div className="text-center header-section">
                {logoUrl && <img src={logoUrl} alt="Logo" className="logo-img" />}
                <h1 className="text-xl font-bold">مطعم كرسبر</h1>
                <p className="text-sm">حي الوحدة قبلي مستشفى بن زيلع</p>
            </div>

            <div className="text-center my-1">
                <h2 className="text-lg font-bold" style={{ margin: '2px 0' }}>فاتورة خاصة بالزبون</h2>
                <p style={{ margin: '0', fontSize: '15px' }}>رقم الفاتورة</p>
                <p className="text-3xl font-bold tracking-wider" style={{ margin: '0', lineHeight: '1.1' }}>{receiptNumber}</p>
            </div>
            
            <div className="solid-hr"></div>

            <div className="details-grid">
                <div>التاريخ:</div><div>{date}</div>
                <div>الساعة:</div><div>{time}</div>
                <div>الكاشير:</div><div>{cashierName}</div>
                <div>نقطة البيع:</div><div>POS-01</div>
                <div>طريقة الدفع:</div><div>{paymentMethod}</div>
            </div>

            <div className="solid-hr"></div>

            <div className="items-grid">
                <div className="header col-1">الصنف</div>
                <div className="header col-2">الكمية</div>
                <div className="header col-3">الإجمالي</div>
            </div>
            
            {orderItems.map((item, index) => (
              <React.Fragment key={item.id + index}>
                <div className="items-grid" style={{paddingTop: '4px'}}>
                  <div className="col-1">{item.name}</div>
                  <div className="col-2">{item.quantity}</div>
                  <div className="col-3">{Math.round(item.price * item.quantity).toLocaleString('ar-SA')}</div>
                </div>
               </React.Fragment>
            ))}
            
            <div className="solid-hr"></div>
            
            <div className="totals-section">
                <div className="flex justify-between">
                    <span>المجموع الفرعي</span>
                    <span>{Math.round(subtotal).toLocaleString('ar-SA')} ر.ي</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between">
                        <span>الخصم</span>
                        <span>-{Math.round(discount).toLocaleString('ar-SA')} ر.ي</span>
                    </div>
                )}
            </div>
            
            <div className="solid-hr"></div>

            <div className="flex justify-between items-center grand-total">
                <span>المجموع الكلي</span>
                <span>{Math.round(total).toLocaleString('ar-SA')} ر.ي</span>
            </div>

            <div className="solid-hr"></div>
            
            <div className="text-center mt-2 text-sm">
                <p className="font-bold">يا حيابكم عندنا!</p>
                {barcodeUrl && (
                  <div className="barcode-section">
                      <img src={barcodeUrl} alt="Barcode" className="barcode-img" />
                      <p className='text-xs'>امسح الباركود من أجل الطلب أونلاين</p>
                  </div>
                )}
            </div>
        </div>
      </div>
    );
  }
);

PrintableReceipt.displayName = 'PrintableReceipt';
