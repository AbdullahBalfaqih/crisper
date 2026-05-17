'use client';

import React from 'react';
import type { OrderItem } from '@/lib/types';

interface KitchenReceiptProps {
  orderItems: OrderItem[];
  receiptNumber: string;
  date: string;
  time: string;
  cashierName: string;
  logoUrl: string | null;
}

export const KitchenReceipt = React.forwardRef<HTMLDivElement, KitchenReceiptProps>(
  ({ orderItems, receiptNumber, date, time, cashierName, logoUrl }, ref) => {
    
    const receiptStyles = `
      .kitchen-receipt-container {
        width: 302px; /* Approx 80mm */
        padding: 10px;
        background: white;
        color: black;
        font-family: 'Almarai', sans-serif;
        direction: rtl;
        box-sizing: border-box;
        font-size: 14px;
        line-height: 1.2;
      }
      .text-center { text-align: center; }
      .font-bold { font-weight: 700; }
      .text-lg { font-size: 1.125rem; }
      .text-base { font-size: 1rem; }
      .text-sm { font-size: 0.875rem; }
      .text-2xl { font-size: 1.5rem; }
      .my-1 { margin-top: 0.1rem; margin-bottom: 0.1rem; }
      .mt-1 { margin-top: 0.25rem; }
      .w-full { width: 100%; }
      .header-section { line-height: 1; margin-bottom: 5px; }
      .header-section h1 { margin: 0; line-height: 1.2; }
      .header-section h2 { margin: 0; line-height: 1.2; }
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
        font-size: 13px;
        line-height: 1.2;
      }
      .details-grid > div { padding: 0; }
      .details-grid > div:nth-child(odd) { font-weight: bold; }
      .details-grid > div:nth-child(even) { text-align: left; }

      .items-table { 
        width: 100%; 
        border-collapse: collapse; 
        font-size: 1.1rem; 
      }
      .items-table .header-row td { 
        font-weight: bold; 
        border-bottom: 1px solid #000;
        padding: 3px 0; 
        line-height: 1.2;
        font-size: 14px;
      }
      .items-table .item-row td { padding-top: 4px; line-height: 1.2;}
      .items-table td:first-child { text-align: right; }
      .items-table td:last-child { text-align: center; width: 25%; }
      .item-notes { 
        font-size: 0.9rem; 
        color: #333; 
        padding-right: 0.75rem; 
        text-align: right; 
        line-height: 1.1;
      }
      .logo-img { max-height: 60px; margin: 0 auto 5px; }
    `;

    return (
      <div ref={ref}>
        <style>{receiptStyles}</style>
        <div className="kitchen-receipt-container">
          <div className="text-center header-section">
            {logoUrl && <img src={logoUrl} alt="Logo" className="logo-img" />}
            <h1 className="text-lg font-bold">مطعم كرسبر</h1>
            <p className="text-sm">حي الوحدة قبلي مستشفى بن زيلع</p>
            <h2 className="text-base font-bold mt-1">فاتورة خاصة بالمطعم</h2>
          </div>

          <div className="text-center my-1">
            <p className="font-bold text-sm" style={{ margin: '0' }}>رقم الفاتورة</p>
            <p className="text-2xl font-bold" style={{ margin: '0', lineHeight: '1.1' }}>{receiptNumber}</p>
          </div>
          
          <div className="solid-hr"></div>

          <div className="details-grid">
              <div>التاريخ:</div><div>{date}</div>
              <div>الوقت:</div><div>{time}</div>
              <div>الكاشير:</div><div>{cashierName}</div>
              <div>نقطة البيع:</div><div>POS-01</div>
          </div>

          <div className="solid-hr"></div>

          <table className="items-table">
            <thead>
              <tr className="header-row">
                <td>الصنف</td>
                <td>الكمية</td>
              </tr>
            </thead>
            <tbody>
            {orderItems.map((item, index) => (
              <React.Fragment key={item.id + index}>
                <tr className="item-row">
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                </tr>
                {item.notes && (
                  <tr>
                    <td colSpan={2} className="item-notes">- {item.notes}</td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            </tbody>
          </table>

          <div className="solid-hr"></div>

          <div className="text-center mt-1">
            <p className="font-bold text-sm">يا حيابكم عندنا!</p>
          </div>
        </div>
      </div>
    );
  }
);

KitchenReceipt.displayName = 'KitchenReceipt';
