'use server';

import type { InventoryItem } from '@/lib/types';
import { format } from 'date-fns';

export async function generateInventoryHtmlReport(inventory: InventoryItem[]): Promise<string> {
    const tableRows = inventory.map(item => `
        <tr>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toLocaleString('ar-SA')} ر.ي</td>
            <td>${(item.price * item.quantity).toLocaleString('ar-SA')} ر.ي</td>
            <td>${format(new Date(item.lastUpdated), 'yyyy/MM/dd hh:mm a')}</td>
        </tr>
    `).join('');

    const totalValue = inventory.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير المخزون</title>
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
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>تقرير المخزون</h1>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}</p>
                <table>
                    <thead>
                        <tr>
                            <th>اسم المنتج</th>
                            <th>الكمية المتاحة</th>
                            <th>سعر الوحدة</th>
                            <th>القيمة الإجمالية</th>
                            <th>آخر تحديث</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <div class="summary">
                    <p>إجمالي قيمة المخزون: <strong style="color: green;">${totalValue.toLocaleString('ar-SA')} ر.ي</strong></p>
                </div>
                <div class="report-footer">
                    <p>نهاية التقرير</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
