

'use server';

import type { OrderItem } from '@/lib/types';
import { generateReportHtml } from '@/services/export-service';
import { generateAccountsReportHtml as generateAccountsHtml } from '@/services/export-accounts-service';
import { generateDebtsReportHtml as generateDebtsHtml } from '@/services/export-debts-service';
import { generateEmployeesReportHtml as generateEmployeesHtml } from '@/services/export-employees-service';
import { generateExpensesReportHtml as generateExpensesHtml } from '@/services/export-expenses-service';
import { generateInventoryHtmlReport as generateInventoryHtml } from '@/services/export-inventory-service';
import { generatePurchasesReportHtml as generatePurchasesHtml } from '@/services/export-purchases-service';
import { generateMenuHtml as generateMenuHtml } from '@/services/export-menu-service';
import { generateCustomersHtmlReport as generateCustomersHtml } from '@/services/export-customers-service';
import { generateComplaintsHtmlReport as generateComplaintsHtml } from '@/services/export-complaints-service';
import { generateHospitalityHtmlReport as generateHospitalityHtml } from '@/services/export-hospitality-service';
import type { Employee } from '@/components/employees-modal';
import type { Transaction } from '@/components/accounting-fund-modal';
import type { Bank } from '@/components/banks-modal';
import type { Currency } from '@/components/currencies-modal';
import type { Branch } from '@/components/branches-modal';
import type { InventoryItem, Product, Category } from '@/lib/types';
import type { Purchase, Supplier } from '@/components/purchases-modal';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type Order = {
  id: number;
  date: string;
  cashier: string;
  items: OrderItem[];
  discount: number;
  payment: 'نقدي' | 'بطاقة' | 'شبكة';
  status: 'نشط' | 'مسترجع';
};

type User = { 
  id: string; 
  username: string; 
  full_name: string;
  email: string; 
  role: string; 
};

type Customer = { 
  id: number; 
  name: string; 
  phone: string; 
  email: string; 
  totalOrders: number; 
  totalSpent: number; 
};

type Complaint = {
  id: number;
  customer: string;
  date: Date;
  subject: string;
  description: string;
  status: string;
};

type Hospitality = {
  id: number;
  employee: string;
  date: string;
  total: number;
  user: string;
  notes: string;
};

type Debt = {
  id: number;
  person: string;
  amount: number;
  currency: string;
  type: 'مدين' | 'دائن';
  dueDate: Date;
  status: 'مسدد' | 'غير مسدد';
};

type Expense = { 
  id: number; 
  date: Date; 
  recipient: string; 
  amount: number; 
  description: string; 
  currency: string; 
};

type DailyPerformance = { 
    date: string; 
    day: string; 
    sales: number; 
    expenses: number; 
    profit: number 
};

type TopProduct = { 
    name: string; 
    value: number 
};

export type ComprehensiveReportData = {
    metrics?: {
        totalSalesByCurrency: Record<string, number>;
        totalExpensesByCurrency: Record<string, number>;
        netProfitByCurrency: Record<string, number>;
        totalOrders: number;
    };
    dailyPerformance?: DailyPerformance[];
    topProducts?: TopProduct[];
    orders?: Order[];
    transactions?: Transaction[];
    products?: Product[];
    banks?: Bank[];
    currencies?: Currency[];
    branches?: Branch[];
    users?: User[];
    logo?: string | null;
};


type PurchasesReportData = {
    purchases: Purchase[];
    suppliers: Supplier[];
}

type MenuReportData = {
    products: Product[];
    categories: Category[];
};


export async function generateHtmlReport(orders: Order[]): Promise<string> {
  try {
    const html = await generateReportHtml(orders);
    return html;
  } catch (error) {
    console.error("Error generating html report in action: ", error);
    throw new Error("Failed to generate html report.");
  }
}

export async function generateAccountsHtmlReport(accounts: User[]): Promise<string> {
  try {
    const html = await generateAccountsHtml(accounts);
    return html;
  } catch (error) {
    console.error("Error generating accounts html report in action: ", error);
    throw new Error("Failed to generate accounts html report.");
  }
}

export async function generateCustomersHtmlReport(customers: Customer[]): Promise<string> {
  try {
    const html = await generateCustomersHtml(customers);
    return html;
  } catch (error) {
    console.error("Error generating customers html report in action: ", error);
    throw new Error("Failed to generate customers html report.");
  }
}

export async function generateComplaintsHtmlReport(complaints: Complaint[]): Promise<string> {
  try {
    const html = await generateComplaintsHtml(complaints);
    return html;
  } catch (error) {
    console.error("Error generating complaints html report in action: ", error);
    throw new Error("Failed to generate complaints html report.");
  }
}

export async function generateHospitalityHtmlReport(hospitality: Hospitality[]): Promise<string> {
  try {
    const html = await generateHospitalityHtml(hospitality);
    return html;
  } catch (error) {
    console.error("Error generating hospitality html report in action: ", error);
    throw new Error("Failed to generate hospitality html report.");
  }
}


export async function generateDebtsHtmlReport(debts: Debt[]): Promise<string> {
  try {
    const html = await generateDebtsHtml(debts);
    return html;
  } catch (error) {
    console.error("Error generating debts html report in action: ", error);
    throw new Error("Failed to generate debts html report.");
  }
}

export async function generateEmployeesReportHtml(employees: Employee[]): Promise<string> {
  try {
    const html = await generateEmployeesHtml(employees);
    return html;
  } catch (error) {
    console.error("Error generating employees html report in action: ", error);
    throw new Error("Failed to generate employees html report.");
  }
}

export async function generateExpensesReportHtml(expenses: Expense[]): Promise<string> {
  try {
    const html = await generateExpensesHtml(expenses);
    return html;
  } catch (error) {
    console.error("Error generating expenses html report in action: ", error);
    throw new Error("Failed to generate expenses html report.");
  }
}

export async function generateInventoryHtmlReport(inventory: InventoryItem[]): Promise<string> {
  try {
    const html = await generateInventoryHtml(inventory);
    return html;
  } catch (error) {
    console.error("Error generating inventory html report in action: ", error);
    throw new Error("Failed to generate inventory html report.");
  }
}

export async function generatePurchasesHtmlReport(data: PurchasesReportData): Promise<string> {
    try {
        const html = await generatePurchasesHtml(data);
        return html;
    } catch (error) {
        console.error("Error generating purchases html report in action: ", error);
        throw new Error("Failed to generate purchases html report.");
    }
}

export async function generateMenuHtmlReport(data: MenuReportData): Promise<string> {
    try {
        const html = await generateMenuHtml(data);
        return html;
    } catch (error) {
        console.error("Error generating menu html report in action: ", error);
        throw new Error("Failed to generate menu html report.");
    }
}

const classificationTranslations: Record<Transaction['classification'], string> = {
    sales: 'مبيعات',
    purchases: 'مشتريات',
    debt_payment: 'سداد دين',
    expense: 'مصروفات عامة',
    salary: 'رواتب',
    other: 'أخرى',
};

const typeTranslations: Record<Transaction['type'], string> = {
    revenue: 'إيراد',
    expense: 'مصروف',
};


export async function generateComprehensiveReportHtml(data: ComprehensiveReportData): Promise<string> {
    const { 
        transactions, banks, currencies, branches, users,
        dailyPerformance, topProducts, orders, metrics, logo
    } = data;

    const logoHtml = logo ? `<img src="${logo}" alt="Restaurant Logo" style="max-height: 80px; margin-bottom: 1rem;" />` : '<h1>كرسبر</h1>';

    const summaryCards = metrics ? `
        <div class="summary-card">
            <h3>إجمالي المبيعات</h3>
            ${Object.entries(metrics.totalSalesByCurrency).map(([currency, total]) => `<p class="value revenue">${total.toLocaleString('en-US')} ${currency}</p>`).join('')}
        </div>
        <div class="summary-card">
            <h3>إجمالي المصروفات</h3>
            ${Object.entries(metrics.totalExpensesByCurrency).map(([currency, total]) => `<p class="value expenses">${total.toLocaleString('en-US')} ${currency}</p>`).join('')}
        </div>
        <div class="summary-card">
            <h3>صافي الربح</h3>
             ${Object.entries(metrics.netProfitByCurrency).map(([currency, total]) => `<p class="value net ${total >= 0 ? 'revenue' : 'expenses'}">${total.toLocaleString('en-US')} ${currency}</p>`).join('')}
        </div>
        <div class="summary-card">
            <h3>عدد الطلبات</h3>
            <p class="value">${metrics.totalOrders}</p>
        </div>
    ` : '';

    const dailyPerformanceRows = dailyPerformance ? dailyPerformance.map(d => `
        <tr>
            <td>${d.date}</td>
            <td>${d.day}</td>
            <td class="revenue">${d.sales.toLocaleString('en-US')} ر.ي</td>
            <td class="expenses">${d.expenses.toLocaleString('en-US')} ر.ي</td>
            <td class="${d.profit >= 0 ? 'revenue' : 'expenses'}">${d.profit.toLocaleString('en-US')} ر.ي</td>
        </tr>
    `).join('') : '';

    const topProductsRows = topProducts ? topProducts.map(p => `
        <tr>
            <td>${p.name}</td>
            <td>${p.value}</td>
        </tr>
    `).join('') : '';

    const ordersRows = orders ? orders.map(o => `
        <tr>
            <td>${o.id}</td>
            <td>${format(new Date(o.date), 'yyyy/MM/dd')}</td>
            <td>${o.cashier}</td>
            <td>${o.items.map(i => i.name).join(', ')}</td>
            <td>${o.payment}</td>
            <td class="currency">${(o.items.reduce((s, i) => s + i.price * i.quantity, 0) - o.discount).toFixed(2)} ر.ي</td>
        </tr>
    `).join('') : '';
    
    const transactionsTable = transactions ? transactions.map(t => {
        const userName = users?.find(u => u.id === t.user_id)?.full_name || t.user_id || 'N/A';
        const branchName = branches?.find(b => b.id === t.branch_id)?.name || t.branch_id || 'N/A';
        return `
        <tr>
            <td>${t.id}</td>
            <td>${format(new Date(t.transaction_date), 'yyyy/MM/dd hh:mm a')}</td>
            <td>${typeTranslations[t.type]}</td>
            <td>${classificationTranslations[t.classification]}</td>
            <td class="${t.type === 'revenue' ? 'revenue' : 'expenses'}">${t.amount.toFixed(2)} ${t.currency}</td>
            <td>${t.description}</td>
            <td>${userName}</td>
            <td>${branchName}</td>
        </tr>
    `}).join('') : '';
    
    const currenciesTable = currencies ? currencies.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.symbol}</td>
            <td>${c.exchange_rate_to_main.toFixed(4)}</td>
            <td>${c.is_main_currency ? 'نعم' : 'لا'}</td>
        </tr>
    `).join('') : '';
    
    const banksTable = banks ? banks.map(b => `
        <tr>
            <td>${b.name}</td>
            <td>${b.iban}</td>
            <td>${b.balance.toLocaleString('en-US')} ر.ي</td>
        </tr>
    `).join('') : '';

    const branchesTable = branches ? branches.map(b => {
        const managerName = users?.find(u => u.id === b.manager_id)?.full_name || 'N/A';
        return `
        <tr>
            <td>${b.name}</td>
            <td>${b.city}</td>
            <td>${managerName}</td>
            <td>${b.phone_number}</td>
        </tr>
    `}).join('') : '';

    const buildTable = (title: string, headers: string[], rows: string | null | undefined) => {
        if (!rows) return '';
        return `
            <h2>${title}</h2>
            <table>
                <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    };

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>التقرير الشامل</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Almarai', sans-serif; margin: 2rem; background-color: #FDFCF9; color: #111827; }
                .container { max-width: 1200px; margin: auto; }
                .header { text-align: center; margin-bottom: 2rem; }
                h1 { color: #F4991A; }
                h2 { color: #28381C; border-bottom: 2px solid #F5EFE6; padding-bottom: 10px; margin-top: 2.5rem; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                th, td { border: 1px solid #F5EFE6; padding: 12px; text-align: center; }
                thead { background-color: #F4991A; color: #1E2A18; }
                tbody tr:nth-child(even) { background-color: #F5EFE6; }
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .summary-card { background-color: #fff; border: 1px solid #F5EFE6; border-radius: 8px; padding: 1.5rem; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .summary-card h3 { margin-top: 0; color: #28381C; font-size: 1rem; }
                .summary-card .value { font-size: 1.5rem; font-weight: bold; }
                .revenue { color: #16a34a; }
                .expenses { color: #dc2626; }
                .net { font-weight: bold; }
                .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;}
                .report-footer { text-align: center; margin-top: 3rem; color: #aaa; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    ${logoHtml}
                    <h1>التقرير الإداري الشامل</h1>
                    <p>تاريخ إنشاء التقرير: ${format(new Date(), 'yyyy/MM/dd')}</p>
                </div>

                ${metrics ? `
                    <div class="section">
                        <h2>ملخص الأداء</h2>
                        <div class="summary-grid">
                            ${summaryCards}
                        </div>
                    </div>
                ` : ''}

                ${dailyPerformanceRows || topProductsRows ? `
                    <div class="section-grid">
                        ${buildTable('الأداء اليومي', ['التاريخ', 'اليوم', 'المبيعات', 'المصروفات', 'صافي الربح'], dailyPerformanceRows)}
                        ${buildTable('الأصناف الأكثر مبيعًا', ['الصنف', 'الكمية المباعة'], topProductsRows)}
                    </div>
                ` : ''}
                
                ${buildTable('سجل الطلبات المفصل', ['#', 'التاريخ', 'الكاشير', 'الأصناف', 'الدفع', 'الإجمالي'], ordersRows)}
                ${buildTable('سجل الحركات المالية', ['معرف', 'التاريخ', 'النوع', 'التصنيف', 'المبلغ', 'الوصف', 'المستخدم', 'الفرع'], transactionsTable)}
                ${buildTable('العملات وأسعار الصرف', ['العملة', 'الرمز', 'سعر الصرف', 'عملة رئيسية'], currenciesTable)}
                ${buildTable('أرصدة الشبكات المصرفية', ['اسم البنك', 'رقم الحساب (IBAN)', 'الرصيد'], banksTable)}
                ${buildTable('بيانات الأفرع', ['اسم الفرع', 'المدينة', 'المدير', 'رقم الهاتف'], branchesTable)}

                <div class="report-footer">
                    <p>هذا التقرير تم إنشاؤه آلياً بواسطة نظام المطاعم.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
