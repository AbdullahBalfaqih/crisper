'use server';

import { format } from 'date-fns';

type Expense = { 
  id: number; 
  date: Date; 
  recipient: string; 
  amount: number; 
  description: string; 
  currency: string; 
};

export async function generateExpensesReportHtml(expenses: Expense[]): Promise<string> {
    const tableRows = expenses.map(exp => `
        <tr>
            <td>${exp.id}</td>
            <td>${format(new Date(exp.date), 'yyyy/MM/dd')}</td>
            <td>${exp.recipient}</td>
            <td>${exp.description}</td>
            <td>${exp.amount.toLocaleString('ar-SA')} ${exp.currency}</td>
        </tr>
    `).join('');

    const totalExpensesByCurrency = expenses.reduce((acc, curr) => {
        if (!acc[curr.currency]) {
            acc[curr.currency] = 0;
        }
        acc[curr.currency] += curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const summaryHtml = Object.entries(totalExpensesByCurrency)
        .map(([currency, total]) => `<p>إجمالي المصروفات (${currency}): <strong style="color: red;">${total.toLocaleString('ar-SA')} ${currency}</strong></p>`)
        .join('');


    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير المصروفات</title>
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
                .summary { border-top: 2px solid #F4991A; padding-top: 1rem; margin-top: 2rem; text-align: right; font-size: 1.2rem; }
                .summary p { margin: 0.5rem 0; }
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>تقرير المصروفات</h1>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}</p>
                <table>
                    <thead>
                        <tr>
                            <th>المعرف</th>
                            <th>التاريخ</th>
                            <th>جهة الصرف</th>
                            <th>البيان</th>
                            <th>المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                 <div class="summary">
                    ${summaryHtml}
                </div>
                <div class="report-footer">
                    <p>نهاية التقرير</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
