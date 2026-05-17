'use server';

import { format } from 'date-fns';

type Complaint = {
  id: number;
  customer: string;
  date: Date;
  subject: string;
  description: string;
  status: string;
};

export async function generateComplaintsHtmlReport(complaints: Complaint[]): Promise<string> {
    const tableRows = complaints.map(c => `
        <tr class="status-${c.status.replace(/\s+/g, '-')}">
            <td>${c.id}</td>
            <td>${c.customer}</td>
            <td>${format(new Date(c.date), 'yyyy/MM/dd')}</td>
            <td>${c.subject}</td>
            <td class="description-cell">${c.description}</td>
            <td><span class="status-badge">${c.status}</span></td>
        </tr>
    `).join('');
    
    const statusCounts = complaints.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير الشكاوى</title>
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
                .description-cell { max-width: 300px; text-align: right; }
                .status-badge { padding: 4px 10px; border-radius: 12px; color: white; font-weight: bold; }
                .status-جديدة .status-badge { background-color: #ef4444; }
                .status-قيد-المراجعة .status-badge { background-color: #3b82f6; }
                .status-تم-الحل .status-badge { background-color: #22c55e; }
                .status-مغلقة .status-badge { background-color: #6b7280; }
                .summary { text-align: center; font-size: 1.1rem; }
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>تقرير الشكاوى</h1>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}</p>
                <div class="summary">
                    <p>
                        إجمالي الشكاوى: ${complaints.length} |
                        جديدة: ${statusCounts['جديدة'] || 0} |
                        قيد المراجعة: ${statusCounts['قيد المراجعة'] || 0} |
                        تم الحل: ${statusCounts['تم الحل'] || 0}
                    </p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>العميل</th>
                            <th>التاريخ</th>
                            <th>الموضوع</th>
                            <th>الوصف</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <div class="report-footer">
                    <p>نهاية التقرير</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
