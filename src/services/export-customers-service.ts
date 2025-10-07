'use server';

type Customer = {
    id: number;
    name: string;
    phone: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
};

export async function generateCustomersHtmlReport(customers: Customer[]): Promise<string> {
    const tableRows = customers.map(cust => `
        <tr>
            <td>${cust.id}</td>
            <td>${cust.name}</td>
            <td>${cust.phone}</td>
            <td>${cust.email}</td>
            <td>${cust.totalOrders}</td>
            <td>${cust.totalSpent.toLocaleString('ar-SA')} ر.ي</td>
        </tr>
    `).join('');

    const totalCustomers = customers.length;
    const totalOrders = customers.reduce((sum, cust) => sum + cust.totalOrders, 0);
    const totalSpent = customers.reduce((sum, cust) => sum + cust.totalSpent, 0);

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير العملاء</title>
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
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .summary-card { background-color: #F5EFE6; border-radius: 0.5rem; padding: 1.5rem; text-align: center; }
                .summary-card h3 { margin-top: 0; color: #28381C; }
                .summary-card .value { font-size: 2rem; font-weight: bold; color: #F4991A; }
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>تقرير العملاء</h1>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}</p>
                 <div class="summary-grid">
                    <div class="summary-card">
                        <h3>إجمالي العملاء</h3>
                        <p class="value">${totalCustomers}</p>
                    </div>
                    <div class="summary-card">
                        <h3>إجمالي الطلبات</h3>
                        <p class="value">${totalOrders}</p>
                    </div>
                    <div class="summary-card">
                        <h3>إجمالي الإنفاق</h3>
                        <p class="value">${totalSpent.toLocaleString('ar-SA')} ر.ي</p>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>المعرف</th>
                            <th>الاسم</th>
                            <th>رقم الجوال</th>
                            <th>البريد الإلكتروني</th>
                            <th>عدد الطلبات</th>
                            <th>إجمالي الإنفاق</th>
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
