'use server';

type User = { 
  id: string; 
  username: string; 
  name: string; 
  email: string;
  phone_number: string;
  password_hash: string;
  role: string; 
};

export async function generateAccountsReportHtml(accounts: User[]): Promise<string> {
    const tableRows = accounts.map(acc => `
        <tr>
            <td>${acc.id}</td>
            <td>${acc.username}</td>
            <td>${acc.name}</td>
            <td>${acc.email}</td>
            <td>${acc.phone_number}</td>
            <td>${acc.password_hash}</td>
            <td>${acc.role}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير حسابات المستخدمين</title>
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
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>تقرير حسابات المستخدمين</h1>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}</p>
                <table>
                    <thead>
                        <tr>
                            <th>المعرف</th>
                            <th>اسم المستخدم</th>
                            <th>الاسم الكامل</th>
                            <th>البريد الإلكتروني</th>
                            <th>رقم الهاتف</th>
                            <th>كلمة المرور</th>
                            <th>الدور</th>
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
