'use server';

import type { OrderItem } from '@/lib/types';
import type { Order } from '@/components/orders-log-modal';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';


export async function generateReportHtml(orders: Order[], dateRange?: { from: Date, to: Date }, logo?: string | null): Promise<string> {
    const activeOrders = orders.filter(o => o.status === 'completed');
    const refundedOrdersCount = orders.filter(o => o.status === 'rejected').length;

    const totalOverall = activeOrders.reduce((acc, order) => acc + order.final_amount, 0);
    const totalCash = activeOrders.filter(o => o.payment_method === 'نقدي').reduce((acc, order) => acc + order.final_amount, 0);
    const totalCard = activeOrders.filter(o => o.payment_method === 'بطاقة').reduce((acc, order) => acc + order.final_amount, 0);
    const totalNetwork = activeOrders.filter(o => o.payment_method === 'شبكة' || o.payment_method === 'تحويل بنكي').reduce((acc, order) => acc + order.final_amount, 0);
    
    const logoHtml = logo ? `<img src="${logo}" alt="Restaurant Logo" style="max-height: 80px; margin-bottom: 1rem;" />` : '<h1>مطعم كرسبر</h1>';
    
    const networkByBank = activeOrders
        .filter(o => (o.payment_method === 'شبكة' || o.payment_method === 'تحويل بنكي'))
        .reduce((acc, order) => {
            const bankName = (order.payment_method === 'تحويل بنكي' && order.order_notes)
                ? order.order_notes.replace('تحويل بنكي عبر:', '').trim()
                : order.bankName;

            if (bankName) {
                if (!acc[bankName]) acc[bankName] = 0;
                acc[bankName] += order.final_amount;
            }
            return acc;
        }, {} as Record<string, number>);

    const productTotals = activeOrders
        .flatMap(o => o.items)
        .reduce((acc, item) => {
            if (!acc[item.name]) {
                acc[item.name] = 0;
            }
            acc[item.name] += item.quantity;
            return acc;
        }, {} as { [key: string]: number });
    
    const productTotalsList = Object.entries(productTotals).map(([name, quantity]) => ({ name, quantity }));
    
    const cashierTotals = activeOrders
        .reduce((acc, order) => {
            const cashierName = order.cashier || 'غير معروف';
            if (cashierName === 'غير مسجل') return acc;
            
            const total = order.final_amount;
            if (!acc[cashierName]) {
                acc[cashierName] = { sales: 0, count: 0 };
            }
            acc[cashierName].sales += total;
            acc[cashierName].count += 1;
            return acc;
        }, {} as {[key: string]: { sales: number; count: number }});

    const cashierTotalsList = Object.entries(cashierTotals).map(([name, data]) => ({name, ...data}));
    
    let dateTitle = 'تقرير المبيعات';
    if (dateRange && dateRange.from) {
        const from = format(dateRange.from, 'yyyy/MM/dd');
        const to = dateRange.to ? format(dateRange.to, 'yyyy/MM/dd') : from;
        dateTitle = from === to ? `تقرير يوم ${from}` : `تقرير الفترة من ${from} إلى ${to}`;
    }

    const tableRows = activeOrders.map(order => {
        let notes = order.order_notes || '-';
        if (order.payment_method === 'تحويل بنكي' && order.order_notes) {
            const bankMatch = order.order_notes.match(/تحويل بنكي عبر:\s*(.*)/);
            if (bankMatch) {
                notes = `تحويل: ${bankMatch[1]}`;
            }
        } else if (order.payment_method === 'شبكة' && order.bankName) {
            notes = `شبكة: ${order.bankName}`;
        }
        
        return `
            <tr>
                <td>${order.id}</td>
                <td>${format(new Date(order.date), 'dd/MM/yyyy, hh:mm a')}</td>
                <td>${order.type === 'pickup' ? 'محلي' : 'أونلاين'}</td>
                <td>${order.cashier}</td>
                <td>${order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}</td>
                <td>${order.total_amount?.toLocaleString('ar-SA')}</td>
                <td>${order.discount_amount > 0 ? `${order.discount_amount.toLocaleString('ar-SA')}` : '-'}</td>
                <td>${order.final_amount?.toLocaleString('ar-SA')}</td>
                <td>${order.payment_method}</td>
                <td>${notes}</td>
            </tr>
        `;
    }).join('');


    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير المبيعات</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Cairo:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Almarai', sans-serif; margin: 2rem; background-color: #FDFCF9; color: #111827; }
                .container { max-width: 1200px; margin: auto; }
                .header { text-align: center; margin-bottom: 2rem; }
                h1, h2 { color: #F4991A; }
                h1 { font-size: 2.5rem; }
                h2 { border-bottom: 2px solid #F5EFE6; padding-bottom: 10px; text-align: center; margin: 2.5rem 0 1.5rem; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                th, td { border: 1px solid #F5EFE6; padding: 12px; text-align: center; }
                thead { background-color: #F4991A; color: #1E2A18; }
                tbody tr:nth-child(even) { background-color: #F5EFE6; }
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .summary-card { background-color: #F5EFE6; border-radius: 0.75rem; padding: 1.5rem; text-align: center; }
                .summary-card h3 { margin-top: 0; color: #28381C; }
                .summary-card .value { font-size: 2rem; font-weight: bold; color: #F4991A; }
                .report-footer { text-align: center; margin-top: 2rem; color: #aaa; }
                .section-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 2rem;
                    align-items: flex-start;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    ${logoHtml}
                    <h1>${dateTitle}</h1>
                    <p>تاريخ إنشاء التقرير: ${format(new Date(), 'yyyy/MM/dd')}</p>
                </div>

                <h2>ملخص الإجماليات</h2>
                <div class="summary-grid">
                    <div class="summary-card">
                        <h3>صافي المبيعات</h3>
                        <p class="value">${totalOverall.toLocaleString('ar-EG')} ر.ي</p>
                    </div>
                     <div class="summary-card">
                        <h3>مدفوعات الكاش</h3>
                        <p class="value">${totalCash.toLocaleString('ar-EG')} ر.ي</p>
                    </div>
                     <div class="summary-card">
                        <h3>مدفوعات البطاقة</h3>
                        <p class="value">${totalCard.toLocaleString('ar-EG')} ر.ي</p>
                    </div>
                    <div class="summary-card">
                        <h3>مدفوعات الشبكة</h3>
                        <p class="value">${totalNetwork.toLocaleString('ar-EG')} ر.ي</p>
                    </div>
                    <div class="summary-card">
                        <h3>عدد المسترجع</h3>
                        <p class="value" style="color: #dc2626;">${refundedOrdersCount}</p>
                    </div>
                </div>

                <div class="section-container">
                     <div>
                        <h2>الأصناف الأكثر مبيعًا</h2>
                        <table>
                            <thead><tr><th>الصنف</th><th>الكمية</th></tr></thead>
                            <tbody>
                                ${productTotalsList.sort((a,b) => b.quantity - a.quantity).map(p => `<tr><td>${p.name}</td><td>${p.quantity}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h2>ملخص أداء الكاشيرات</h2>
                        <table>
                            <thead><tr><th>الكاشير</th><th>عدد الفواتير</th><th>إجمالي المبيعات</th></tr></thead>
                            <tbody>
                                ${cashierTotalsList.map(c => `<tr><td>${c.name}</td><td>${c.count}</td><td>${c.sales.toLocaleString('ar-EG')} ر.ي</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h2>تفاصيل مبيعات الشبكة</h2>
                        <table>
                            <thead><tr><th>البنك</th><th>إجمالي المبيعات</th></tr></thead>
                            <tbody>
                                ${Object.entries(networkByBank).map(([name, total]) => `<tr><td>${name}</td><td>${total.toLocaleString('ar-EG')} ر.ي</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                 <h2>السجل التفصيلي للفواتير</h2>
                 <table>
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>تاريخ الفاتورة</th>
                            <th>نوع الطلب</th>
                            <th>الكاشير</th>
                            <th>المنتجات</th>
                            <th>الإجمالي</th>
                            <th>الخصم</th>
                            <th>الصافي</th>
                            <th>الدفع</th>
                            <th>ملاحظات</th>
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
