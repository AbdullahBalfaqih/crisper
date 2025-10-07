'use client';

import React from 'react';
import { format } from 'date-fns';

type NeedItem = {
  id: number;
  name: string;
  quantity: string;
  notes: string;
  status: 'required' | 'purchased';
};

interface NeedsListReceiptProps {
  needs: NeedItem[];
  logo: string | null;
}

export const NeedsListReceipt = React.forwardRef<HTMLDivElement, NeedsListReceiptProps>(
  ({ needs, logo }, ref) => {
    
    const requiredNeeds = needs.filter(n => n.status === 'required');

    const tableRowsHtml = requiredNeeds.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; width: 40px; text-align: center;"><div style="width: 20px; height: 20px; border: 1px solid #333; border-radius: 4px; margin: auto;"></div></td>
            <td style="padding: 8px; font-weight: bold;">${item.name}</td>
            <td style="padding: 8px;">${item.quantity}</td>
            <td style="padding: 8px; font-size: 10px; color: #555;">${item.notes}</td>
        </tr>
    `).join('');
    
    const logoHtml = logo ? `<img src="${logo}" alt="Logo" style="max-height: 50px; max-width: 150px; margin-bottom: 5px;" />` : '';

    const receiptHtml = `
        <div style="width: 80mm; margin: auto; padding: 10px; font-size: 12px; line-height: 1.6; color: #111; background: #fff;">
            <div style="text-align: center; margin-bottom: 10px;">
                ${logoHtml}
                <h2 style="margin: 0; font-size: 18px;">مطعم كرسبر</h2>
                <p style="margin: 2px 0; font-size: 14px; font-weight: bold;">قائمة الاحتياجات اليومية</p>
                <p style="margin: 2px 0; font-size: 11px;">تاريخ الطباعة: ${format(new Date(), 'yyyy/MM/dd HH:mm')}</p>
            </div>
            
            <hr style="border: none; border-top: 1px dashed #333; margin: 10px 0;">

            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 8px; width: 40px;"></th>
                        <th style="padding: 8px; text-align: right;">المتطلب</th>
                        <th style="padding: 8px; text-align: right;">الكمية</th>
                        <th style="padding: 8px; text-align: right;">ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>

            <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px;">
                <div style="width: 45%; text-align: center;">
                    <p style="margin-bottom: 30px;">توقيع المستلم:</p>
                    <hr style="border-top: 1px solid #333;">
                </div>
                <div style="width: 45%; text-align: center;">
                    <p style="margin-bottom: 30px;">توقيع المسؤول:</p>
                    <hr style="border-top: 1px solid #333;">
                </div>
            </div>
        </div>
    `;
    
    return (
      <div ref={ref} dangerouslySetInnerHTML={{ __html: receiptHtml }} />
    );
  }
);

NeedsListReceipt.displayName = 'NeedsListReceipt';
