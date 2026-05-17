'use client';

import React from 'react';
import type { Employee, Absence, SalaryPayment, Bonus } from './employees-modal';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface EmployeeRecordProps {
  employee: Employee;
  absences: Absence[];
  payments: SalaryPayment[];
  bonuses: Bonus[];
  netSalary: number;
  logo: string | null;
}

export const EmployeeRecord = React.forwardRef<HTMLDivElement, EmployeeRecordProps>(
  ({ employee, absences, payments, bonuses, netSalary, logo }, ref) => {
    
    const totalDeductions = absences.reduce((sum, a) => sum + a.deduction, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
    
    const currentMonth = format(new Date(), 'MMMM yyyy', { locale: ar });
    
    return (
      <div ref={ref}>
        <div className="receipt-container">
          <div className="header">
            {logo && (
              <div className="logo-container">
                <img src={logo} alt="Logo" className="logo" />
              </div>
            )}
            <h2>مطعم كرسبر</h2>
            <p>سجل الموظف المالي لشهر {currentMonth}</p>
          </div>

          <div className="details">
            <p><strong>اسم الموظف:</strong> {employee.name}</p>
            <p><strong>الوظيفة:</strong> {employee.jobTitle}</p>
            <p><strong>تاريخ التوظيف:</strong> {format(new Date(employee.hireDate), 'yyyy/MM/dd')}</p>
          </div>

          <hr/>

          <div className="section">
            <p><strong>الراتب الأساسي:</strong> {employee.salary.toLocaleString('ar-SA')} {employee.currency}</p>
          </div>

          <hr/>
          
          <div className="section">
            <h4>العلاوات</h4>
            {bonuses.length > 0 ? bonuses.map(b => (
              <div className="item" key={`bonus-${b.id}`}>
                <span>{b.notes} ({format(new Date(b.date), 'dd/MM')})</span>
                <span>+{b.amount.toLocaleString('ar-SA')} {b.currency}</span>
              </div>
            )) : <p className="no-data">لا توجد علاوات</p>}
            <div className="total-line">
              <span>إجمالي العلاوات:</span>
              <span>{totalBonuses.toLocaleString('ar-SA')} {employee.currency}</span>
            </div>
          </div>
          
          <hr/>

          <div className="section">
            <h4>الخصومات (الغياب)</h4>
            {absences.length > 0 ? absences.map(a => (
              <div className="item" key={`absence-${a.id}`}>
                <span>{a.reason} ({format(new Date(a.date), 'dd/MM')})</span>
                <span>-{a.deduction.toLocaleString('ar-SA')} {a.currency}</span>
              </div>
            )) : <p className="no-data">لا توجد خصومات</p>}
             <div className="total-line">
              <span>إجمالي الخصومات:</span>
              <span>-{totalDeductions.toLocaleString('ar-SA')} {employee.currency}</span>
            </div>
          </div>

          <hr/>
          
          <div className="section">
            <h4>السلف والمدفوعات</h4>
            {payments.length > 0 ? payments.map(p => (
              <div className="item" key={`payment-${p.id}`}>
                <span>{p.notes} ({format(new Date(p.date), 'dd/MM')})</span>
                <span>-{p.amount.toLocaleString('ar-SA')} {p.currency}</span>
              </div>
            )) : <p className="no-data">لا توجد سلف</p>}
             <div className="total-line">
              <span>إجمالي السلف:</span>
              <span>-{totalPayments.toLocaleString('ar-SA')} {employee.currency}</span>
            </div>
          </div>
          
          <hr className="bold-hr"/>

          <div className="final-total">
            <h3>صافي الراتب المستحق</h3>
            <h3>{netSalary.toLocaleString('ar-SA')} {employee.currency}</h3>
          </div>

          <div className="signatures">
            <div className="signature-line">
                <p>توقيع الموظف</p>
            </div>
            <div className="signature-line">
                <p>توقيع المدير</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EmployeeRecord.displayName = 'EmployeeRecord';
