'use server';

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

export async function generateDebtsReportHtml(debts: Debt[]): Promise<string> {
    const tableRows = debts.map(debt => `
        <tr style="color: ${debt.status === 'مسدد' ? '#888' : 'inherit'}; text-decoration: ${debt.status === 'مسدد' ? 'line-through' : 'none'};">
            <td>${debt.id}</td>
            <td>${debt.person}</td>
            <td style="color: ${debt.type === 'مدين' ? 'green' : 'red'}; font-weight: bold;">${debt.amount.toLocaleString('ar-SA')} ${debt.currency}</td>
            <td>${debt.type === 'مدين' ? 'مبلغ لنا' : 'مبلغ علينا'}</td>
            <td>${format(new Date(debt.dueDate), 'yyyy/MM/dd')}</td>
            <td>${debt.status}</td>
        </tr>
    `).join('');

    const totalUnpaidDebtor = debts.filter(d => d.type === 'مدين' && d.status === 'غير مسدد').reduce((sum, d) => sum + d.amount, 0);
    const totalUnpaidCreditor = debts.filter(d => d.type === 'دائن' && d.status === 'غير مسدد').reduce((sum, d) => sum + d.amount, 0);


    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير الذمم والديون</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Almarai', sans-serif; margin: 2rem; background-color: #FDFCF9; color: #111827; }
                .container { max-width: 1200px; margin: auto; }
                h1 { color: #F4991A; border-bottom: 2px solid #F5EFE6; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                th, td { border: 1px solid #F5EFE6; padding: 12px; text-align: center; }
                thead { background-color: #F4991A; color: #1E2A18; }
                tbody tr:nth-child(even) { background-color: #F5EFE6; }
                .summary { border-top: 2px solid #F4991A; padding-top: 1rem; margin-top: 2rem; text-align: center; font-size: 1.2rem; }
                .summary p { margin: 0.5rem 0; }
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>تقرير الذمم والديون</h1>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}</p>
                <table>
                    <thead>
                        <tr>
                            <th>رقم الدين</th>
                            <th>الشخص</th>
                            <th>المبلغ</th>
                            <th>البيان</th>
                            <th>تاريخ الاستحقاق</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <div class="summary">
                    <h2>ملخص الديون غير المسددة</h2>
                    <p>إجمالي المبالغ المستحقة لنا (مدين): <strong style="color: green;">${totalUnpaidDebtor.toLocaleString('ar-SA')} ر.ي</strong></p>
                    <p>إجمالي المبالغ المستحقة علينا (دائن): <strong style="color: red;">${totalUnpaidCreditor.toLocaleString('ar-SA')} ر.ي</strong></p>
                </div>
                <div class="report-footer">
                    <p>نهاية التقرير</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
