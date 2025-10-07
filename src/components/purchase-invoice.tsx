'use client';

import React from 'react';
import type { Purchase } from './purchases-modal';
import { format } from 'date-fns';

interface PurchaseInvoiceProps {
  purchase: Purchase;
  logo: string | null;
}

export const PurchaseInvoice = React.forwardRef<HTMLDivElement, PurchaseInvoiceProps>(
  ({ purchase, logo }, ref) => {
    
    return (
      <div ref={ref}>
        <style>{`
          .invoice-box-small {
            width: 80mm;
            margin: auto;
            padding: 10px;
            font-size: 12px;
            line-height: 1.6;
            font-family: 'Cairo', 'Almarai', sans-serif;
            color: #111;
            direction: rtl;
            background: #fff;
          }
          .header-small { text-align: center; margin-bottom: 10px; }
          .header-small img { max-height: 60px; max-width: 150px; margin-bottom: 5px; }
          .header-small h2 { margin: 0; font-size: 18px; color: #111827;}
          .header-small p { margin: 2px 0; font-size: 11px; }
          .invoice-title-small {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
            padding: 5px 0;
            border-top: 2px dashed #111;
            border-bottom: 2px dashed #111;
          }
          .details-table-small { width: 100%; font-size: 11px; margin-bottom: 10px; }
          .details-table-small td { padding: 4px 0; }
          .details-table-small .label { font-weight: bold; }
          .items-table-small { width: 100%; border-collapse: collapse; font-size: 10px; }
          .items-table-small th, .items-table-small td { padding: 5px 2px; text-align: center; border-bottom: 1px solid #eee; }
          .items-table-small th { background-color: #f8f8f8; font-weight: bold; }
          .total-section-small {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #111;
          }
          .total-label { font-size: 14px; font-weight: bold; }
          .total-amount { font-size: 18px; font-weight: bold; text-align: center; }
          .footer-small { text-align: center; margin-top: 20px; font-size: 11px; }
          .footer-small p { margin-top: 20px; }
        `}</style>

        <div className="invoice-box-small">
          <div className="header-small">
            {logo && <img src={logo} alt="Logo" />}
            <h2>مطعم كرسبر</h2>
            <p>فاتورة مشتريات</p>
          </div>

          <div className="invoice-title-small">
            فاتورة رقم: {purchase.invoiceId}
          </div>

          <table className="details-table-small">
            <tbody>
              <tr>
                <td className="label">التاريخ:</td>
                <td>{format(new Date(purchase.date), 'yyyy/MM/dd hh:mm a')}</td>
              </tr>
              <tr>
                <td className="label">المورد:</td>
                <td>{purchase.supplier}</td>
              </tr>
            </tbody>
          </table>
          
          <table className="items-table-small">
              <thead>
                  <tr>
                      <th>الصنف</th>
                      <th>الكمية</th>
                      <th>السعر</th>
                      <th>الإجمالي</th>
                  </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => (
                    <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.price.toFixed(2)}</td>
                        <td>{item.total.toFixed(2)}</td>
                    </tr>
                ))}
              </tbody>
          </table>

          <div className="total-section-small">
            <table className="details-table-small">
                <tbody>
                    <tr>
                        <td className="total-label">المبلغ الإجمالي:</td>
                        <td className="total-amount">{purchase.totalAmount.toLocaleString('ar-SA')} {purchase.currency}</td>
                    </tr>
                </tbody>
            </table>
          </div>
          
           <div className="footer-small">
            <p>توقيع المحاسب: ________________</p>
            <p>توقيع المستلم: ________________</p>
          </div>

        </div>
      </div>
    );
  }
);

PurchaseInvoice.displayName = 'PurchaseInvoice';
