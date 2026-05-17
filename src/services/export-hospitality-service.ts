'use server';

type Hospitality = {
  id: number;
  employee: string;
  date: string;
  total: number;
  user: string;
  notes: string;
};

export async function generateHospitalityHtmlReport(hospitality: Hospitality[]): Promise<string> {
    const tableRows = hospitality.map(h => `
        <tr>
            <td>${h.id}</td>
            <td>${h.employee}</td>
            <td>${h.date}</td>
            <td>${h.total.toFixed(2)} ر.ي</td>
            <td>${h.user}</td>
            <td>${h.notes}</td>
        </tr>
    `).join('');

    const totalHospitality = hospitality.reduce((sum, h) => sum + h.total, 0);

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير الضيافة</title>
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
                .summary { border-top: 2px solid #F4991A; padding-top: 1rem; margin-top: 2rem; text-align: center; font-size: 1.5rem; }
                .summary .value { font-weight: bold; color: #F4991A; }
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>تقرير سجل الضيافة</h1>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}</p>
                <table>
                    <thead>
                        <tr>
                            <th>رقم الضيافة</th>
                            <th>اسم الموظف</th>
                            <th>التاريخ</th>
                            <th>الإجمالي</th>
                            <th>المستخدم</th>
                            <th>الملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <div class="summary">
                    <p>إجمالي تكلفة الضيافة: <span class="value">${totalHospitality.toLocaleString('ar-SA')} ر.ي</span></p>
                </div>
                <div class="report-footer">
                    <p>نهاية التقرير</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
