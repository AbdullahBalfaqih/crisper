'use server';

import { format } from 'date-fns';
import type { Purchase, Supplier } from '@/components/purchases-modal';

type PurchasesReportData = {
    purchases: Purchase[];
    suppliers: Supplier[];
};

export async function generatePurchasesReportHtml(data: PurchasesReportData): Promise<string> {
    const { purchases, suppliers } = data;

    const purchaseRows = purchases.map(p => {
        const supplierDetails = suppliers.find(s => s.name === p.supplier);
        const itemsHtml = p.items.map(i => `<li>${i.name} (الكمية: ${i.quantity}, السعر: ${i.price})</li>`).join('');

        return `
            <div class="purchase-card">
                <div class="card-header">
                    <h3>فاتورة #${p.invoiceId} - ${p.supplier}</h3>
                    <span>${format(new Date(p.date), 'yyyy/MM/dd')}</span>
                </div>
                <div class="card-content">
                    <p><strong>هاتف المورد:</strong> ${supplierDetails?.phone || 'N/A'}</p>
                    <ul>${itemsHtml}</ul>
                </div>
                <div class="card-footer">
                    <span>الإجمالي:</span>
                    <span>${p.totalAmount.toLocaleString('ar-SA')} ${p.currency}</span>
                </div>
            </div>
        `;
    }).join('');

    const totalByCurrency = purchases.reduce((acc, p) => {
        if(!acc[p.currency]) acc[p.currency] = 0;
        acc[p.currency] += p.totalAmount;
        return acc;
    }, {} as Record<string, number>);

    const summaryHtml = Object.entries(totalByCurrency).map(([currency, total]) => `
        <div class="summary-item">
            <h4>إجمالي المشتريات (${currency})</h4>
            <p>${total.toLocaleString('ar-SA')} ${currency}</p>
        </div>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير المشتريات</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Almarai', sans-serif; margin: 2rem; background-color: #FDFCF9; color: #111827; }
                .container { max-width: 1200px; margin: auto; }
                h1 { color: #F4991A; border-bottom: 2px solid #F5EFE6; padding-bottom: 10px; }
                .report-summary { display: flex; gap: 1rem; margin: 2rem 0; padding: 1rem; background-color: #F5EFE6; border-radius: 8px; }
                .summary-item { text-align: center; flex-grow: 1; }
                .summary-item h4 { margin: 0 0 0.5rem 0; color: #28381C; }
                .summary-item p { margin: 0; font-size: 1.5rem; font-weight: bold; color: #F4991A; }
                .purchases-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
                .purchase-card { background: #fff; border: 1px solid #F5EFE6; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden; }
                .card-header { background: #F4991A; color: #1E2A18; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
                .card-header h3 { margin: 0; font-size: 1.1rem; }
                .card-content { padding: 1rem; }
                .card-content ul { padding-right: 20px; margin: 0; }
                .card-footer { background: #F5EFE6; padding: 0.75rem 1rem; text-align: left; font-weight: bold; display: flex; justify-content: space-between; }
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>تقرير المشتريات</h1>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}</p>
                <div class="report-summary">${summaryHtml}</div>
                <div class="purchases-grid">${purchaseRows}</div>
                <div class="report-footer"><p>نهاية التقرير</p></div>
            </div>
        </body>
        </html>
    `;
}
