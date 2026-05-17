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

interface DebtStatementProps {
  person: string;
  debts: Debt[];
  logo: string | null;
}

export const DebtStatement = React.forwardRef<HTMLDivElement, DebtStatementProps>(
  ({ person, debts, logo }, ref) => {
    
    const totals = debts.reduce((acc, debt) => {
        if (!acc[debt.currency]) {
            acc[debt.currency] = { debtor: 0, creditor: 0 };
        }
        if (debt.type === 'مدين') {
            acc[debt.currency].debtor += debt.amount;
        } else {
            acc[debt.currency].creditor += debt.amount;
        }
        return acc;
    }, {} as Record<string, { debtor: number, creditor: number }>);

    const tableRowsHtml = debts.map(debt => `
        <tr style="color: ${debt.status === 'مسدد' ? '#666' : '#111'};">
            <td>${format(new Date(debt.dueDate), 'yy/MM/dd')}</td>
            <td>دين رقم #${debt.id}</td>
            <td style="color: green;">${debt.type === 'مدين' ? `${debt.amount.toLocaleString('ar-SA')} ${debt.currency}` : '0'}</td>
            <td style="color: red;">${debt.type === 'دائن' ? `${debt.amount.toLocaleString('ar-SA')} ${debt.currency}` : '0'}</td>
        </tr>
    `).join('');
    
    const summaryRowsHtml = Object.entries(totals).map(([currency, {debtor, creditor}]) => {
        const balance = debtor - creditor;
        return `
            <div class="summary-row">
                <h3>ملخص (${currency})</h3>
                <div>
                    <span>إجمالي المبالغ لنا (مدين):</span>
                    <span style="color: green; font-weight: bold;">${debtor.toLocaleString('ar-SA')} ${currency}</span>
                </div>
                <div>
                    <span>إجمالي المبالغ علينا (دائن):</span>
                    <span style="color: red; font-weight: bold;">${creditor.toLocaleString('ar-SA')} ${currency}</span>
                </div>
                <div class="final-balance">
                    <span>الرصيد النهائي:</span>
                    <span style="color: ${balance >= 0 ? 'green' : 'red'};">${Math.abs(balance).toLocaleString('ar-SA')} ${currency} (${balance >= 0 ? 'مبلغ لنا' : 'مبلغ علينا'})</span>
                </div>
            </div>
        `;
    }).join('');

    const logoHtml = logo ? `<img src="${logo}" alt="Logo" style="max-width: 150px; max-height: 60px; margin-bottom: 5px;" />` : '';

    const statementHtml = `
      <style>
        .statement-box {
          width: 80mm;
          margin: auto;
          padding: 10px;
          font-size: 11px;
          line-height: 1.5;
          font-family: 'Almarai', sans-serif;
          color: #111;
          direction: rtl;
          background: #fff;
        }
        .header-statement { text-align: center; margin-bottom: 10px; }
        .header-statement h2 { margin: 0; font-size: 16px; }
        .header-statement p { margin: 2px 0; }
        .statement-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin: 10px 0;
          padding: 5px 0;
          border-top: 1px solid #111;
          border-bottom: 1px solid #111;
        }
        .details-statement { font-size: 12px; margin-bottom: 10px; }
        .statement-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .statement-table th, .statement-table td { padding: 5px 2px; text-align: center; border-bottom: 1px solid #eee; }
        .statement-table th { background-color: #f8f8f8; font-weight: bold; }
        .summary-statement {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 2px dashed #111;
          font-size: 12px;
        }
        .summary-row { margin-bottom: 15px; }
        .summary-statement div { display: flex; justify-content: space-between; padding: 2px 0; }
        .summary-statement .final-balance { font-size: 14px; font-weight: bold; border-top: 1px solid #111; padding-top: 5px; margin-top: 5px; }
        .footer-statement { text-align: center; margin-top: 20px; font-size: 10px; }
      </style>
      
      <div class="statement-box">
          <div class="header-statement">
              ${logoHtml}
              <h2>مطعم كرسبر</h2>
              <p>كشف حساب مالي</p>
          </div>
          
          <div class="details-statement">
              <div><strong>الشخص:</strong> ${person}</div>
              <div><strong>تاريخ الكشف:</strong> ${format(new Date(), 'yyyy/MM/dd')}</div>
          </div>

          <div class="statement-title">
              تفاصيل الحركات
          </div>
          
          <table class="statement-table">
              <thead>
                  <tr>
                      <th>التاريخ</th>
                      <th>البيان</th>
                      <th>مدين (لنا)</th>
                      <th>دائن (علينا)</th>
                  </tr>
              </thead>
              <tbody >
                ${tableRowsHtml}
              </tbody>
          </table>

          <div class="summary-statement">
              ${summaryRowsHtml}
          </div>

          <div class="footer-statement">
              <p style="margin-top: 30px;">توقيع المحاسب: ________________</p>
              <p>هذا كشف حساب تم إنشاؤه آلياً.</p>
          </div>
      </div>
    `;

    return (
        <div ref={ref} dangerouslySetInnerHTML={{ __html: statementHtml }} />
    );
  }
);

DebtStatement.displayName = 'DebtStatement';
