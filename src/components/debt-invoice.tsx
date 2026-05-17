'use client';

import React from 'react';
import { format } from 'date-fns';

type Debt = {
  id: number;
  person: string;
  amount: number;
  currency: string;
  type: 'مدين' | 'دائن';
  dueDate: Date;
  status: 'مسدد' | 'غير مسدد';
};

interface DebtInvoiceProps {
  debt: Debt;
  logo: string | null;
}

export const DebtInvoice = React.forwardRef<HTMLDivElement, DebtInvoiceProps>(
  ({ debt, logo }, ref) => {
    
    return (
      <div ref={ref}>
        <style>{`
          .invoice-box-small {
            width: 80mm;
            margin: auto;
            padding: 10px;
            font-size: 12px;
            line-height: 1.6;
            font-family: 'Almarai', sans-serif;
            color: #111;
            direction: rtl;
            background: #fff;
          }
          .header-small { text-align: center; margin-bottom: 10px; }
          .header-small img { max-width: 150px; max-height: 60px; margin-bottom: 5px; }
          .header-small h2 { margin: 0; font-size: 18px; color: #111827;}
          .header-small p { margin: 2px 0; font-size: 11px; }
          .invoice-title-small {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
            padding: 5px 0;
            border-top: 2px dashed #111;
            border-bottom: 2px dashed #111;
          }
          .details-table-small { width: 100%; font-size: 11px; }
          .details-table-small td { padding: 4px 0; }
          .details-table-small .label { font-weight: bold; }
          .total-section-small {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #111;
          }
          .total-section-small .total-label { font-size: 14px; font-weight: bold; }
          .total-section-small .total-amount { font-size: 18px; font-weight: bold; }
          .footer-small { text-align: center; margin-top: 20px; font-size: 11px; }
          .footer-small p { margin-top: 20px; }
        `}</style>

        <div className="invoice-box-small">
          <div className="header-small">
            {logo && <img src={logo} alt="Logo" />}
            <h2>مطعم كرسبر</h2>
            <p>سند دين</p>
          </div>

          <div className="invoice-title-small">
            فاتورة دين رقم: {debt.id}
          </div>

          <table className="details-table-small">
            <tbody>
              <tr>
                <td className="label">التاريخ:</td>
                <td>{format(new Date(), 'yyyy/MM/dd')}</td>
              </tr>
              <tr>
                <td className="label">اسم الشخص:</td>
                <td>{debt.person}</td>
              </tr>
              <tr>
                <td className="label">نوع الدين:</td>
                <td>{debt.type === 'مدين' ? 'مبلغ لنا' : 'مبلغ علينا'}</td>
              </tr>
              <tr>
                <td className="label">الحالة:</td>
                <td>{debt.status}</td>
              </tr>
            </tbody>
          </table>

          <div className="total-section-small">
            <table className="details-table-small">
                <tbody>
                    <tr>
                        <td className="total-label">المبلغ:</td>
                        <td className="total-amount" style={{ textAlign: 'center' }}>{debt.amount.toLocaleString('ar-SA')} {debt.currency}</td>
                    </tr>
                </tbody>
            </table>
          </div>
          
           <div className="footer-small">
            <p>توقيع المدير: ________________</p>
            <p>توقيع المستلم: ________________</p>
          </div>

        </div>
      </div>
    );
  }
);

DebtInvoice.displayName = 'DebtInvoice';
