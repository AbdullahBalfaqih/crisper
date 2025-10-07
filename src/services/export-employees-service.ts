'use server';

import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type Employee = {
    id: number;
    name: string;
    jobTitle: string;
    nationalId: string;
    salary: number;
    currency: string;
    hireDate: Date;
    notes: string;
    absences: { date: Date; reason: string; deduction: number; currency: string }[];
    bonuses: { date: Date; notes: string; amount: number; currency: string }[];
    advances: { date: Date; notes: string; amount: number; currency: string }[];
};

export async function generateEmployeesReportHtml(employees: Employee[]): Promise<string> {
    
    const employeeSections = employees.map(emp => {
        const totalDeductions = emp.absences.reduce((sum, a) => sum + a.deduction, 0);
        const totalBonuses = emp.bonuses.reduce((sum, b) => sum + b.amount, 0);
        const totalAdvances = emp.advances.reduce((sum, p) => sum + p.amount, 0);
        const netSalary = (emp.salary || 0) + totalBonuses - totalDeductions - totalAdvances;

        const bonusesHtml = emp.bonuses.length > 0 ? emp.bonuses.map(b => `<tr><td>${format(new Date(b.date), 'yyyy/MM/dd')}</td><td>${b.notes}</td><td>+${b.amount.toLocaleString('ar-SA')} ${b.currency}</td></tr>`).join('') : '<tr><td colspan="3">لا توجد</td></tr>';
        const advancesHtml = emp.advances.length > 0 ? emp.advances.map(p => `<tr><td>${format(new Date(p.date), 'yyyy/MM/dd')}</td><td>${p.notes}</td><td>-${p.amount.toLocaleString('ar-SA')} ${p.currency}</td></tr>`).join('') : '<tr><td colspan="3">لا توجد</td></tr>';
        const absencesHtml = emp.absences.length > 0 ? emp.absences.map(a => `<tr><td>${format(new Date(a.date), 'yyyy/MM/dd')}</td><td>${a.reason}</td><td>-${a.deduction.toLocaleString('ar-SA')} ${a.currency}</td></tr>`).join('') : '<tr><td colspan="3">لا توجد</td></tr>';

        return `
            <div class="employee-card">
                <h2>${emp.name} <span class="job-title">(${emp.jobTitle})</span></h2>
                <div class="details">
                    <p><strong>الراتب الأساسي:</strong> ${emp.salary.toLocaleString('ar-SA')} ${emp.currency}</p>
                    <p><strong>رقم الجوال:</strong> ${emp.nationalId}</p>
                    <p><strong>تاريخ التوظيف:</strong> ${format(new Date(emp.hireDate), 'yyyy/MM/dd')}</p>
                </div>
                <div class="financial-tables">
                    <div>
                        <h3>العلاوات</h3>
                        <table>
                            <thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th></tr></thead>
                            <tbody>${bonusesHtml}</tbody>
                        </table>
                    </div>
                    <div>
                        <h3>السلف والمدفوعات</h3>
                        <table>
                            <thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th></tr></thead>
                            <tbody>${advancesHtml}</tbody>
                        </table>
                    </div>
                    <div>
                        <h3>الغياب والخصومات</h3>
                        <table>
                            <thead><tr><th>التاريخ</th><th>السبب</th><th>الخصم</th></tr></thead>
                            <tbody>${absencesHtml}</tbody>
                        </table>
                    </div>
                </div>
                <div class="summary">
                    <p>إجمالي العلاوات: <span class="bonus">+${totalBonuses.toLocaleString('ar-SA')} ${emp.currency}</span></p>
                    <p>إجمالي الخصومات: <span class="deduction">-${totalDeductions.toLocaleString('ar-SA')} ${emp.currency}</span></p>
                    <p>إجمالي السلف: <span class="deduction">-${totalAdvances.toLocaleString('ar-SA')} ${emp.currency}</span></p>
                    <p class="net-salary">صافي الراتب المستحق: <span>${netSalary.toLocaleString('ar-SA')} ${emp.currency}</span></p>
                </div>
            </div>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير الموظفين المالي</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Almarai', sans-serif; margin: 2rem; background-color: #FDFCF9; color: #111827; }
                .container { max-width: 1200px; margin: auto; }
                h1 { color: #F4991A; border-bottom: 2px solid #F5EFE6; padding-bottom: 10px; }
                .employee-card { border: 1px solid #F5EFE6; border-radius: 8px; margin-bottom: 2rem; padding: 1.5rem; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .employee-card h2 { color: #28381C; margin-top: 0; }
                .job-title { font-size: 1rem; color: #555; }
                .details { display: flex; gap: 2rem; margin-bottom: 1rem; }
                .financial-tables { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1rem; }
                .financial-tables h3 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 1.1rem; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #F5EFE6; padding: 8px; text-align: center; font-size: 0.9rem; }
                thead { background-color: #F5EFE6; }
                .summary { border-top: 2px dashed #F4991A; padding-top: 1rem; margin-top: 1rem; font-weight: bold; }
                .summary p { display: flex; justify-content: space-between; }
                .bonus { color: green; }
                .deduction { color: red; }
                .net-salary { font-size: 1.2rem; background-color: #F5EFE6; padding: 10px; border-radius: 4px; }
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>التقرير المالي للموظفين لشهر ${format(new Date(), 'MMMM yyyy', { locale: ar })}</h1>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}</p>
                ${employeeSections}
                <div class="report-footer">
                    <p>نهاية التقرير</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
