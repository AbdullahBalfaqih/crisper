'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { PosView } from './pos-view';
import { Dashboard } from './dashboard';
import { PaymentDialog, type PaymentMethod } from './payment-dialog';
import { ReceiptModal } from './receipt-modal';
import { OrdersLogModal, type Order } from './orders-log-modal';
import { HospitalityLogModal } from './hospitality-log-modal';
import { NeedsModal } from './needs-modal';
import { InventoryModal } from './inventory-modal';
import { CategoriesModal } from './categories-modal';
import { SalesReportModal } from './sales-report-modal';
import { StatisticsModal } from './statistics-modal';
import { ManagementPlaceholderModal } from './management-placeholder-modal';
import type { OrderItem, Product, InventoryItem, Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DebtsModal } from './debts-modal';
import { ExpensesModal } from './expenses-modal';
import { AccountingFundModal, type Transaction } from './accounting-fund-modal';
import { EmployeesModal } from './employees-modal';
import { RecipesModal } from './recipes-modal';
import { PurchasesModal } from './purchases-modal';
import { SettingsModal } from './settings-modal';
import { AccountsModal } from './accounts-modal';
import { CreateAdminModal } from './create-admin-modal';
import { CurrenciesModal } from './currencies-modal';
import { BranchesModal } from './branches-modal';
import { RaffleModal } from './raffle-modal';
import { ComplaintsModal } from './complaints-modal';
import { CustomersModal } from './customers-modal';
import { EmailModal } from './email-modal';
import { OnlineOrdersModal } from './online-orders-modal';
import { PeakHoursModal } from './peak-hours-modal';
import { DailySummaryLogModal } from './daily-summary-log-modal';
import { BanksModal } from './banks-modal';
import { CouponsModal } from './coupons-modal';
import { useAuth } from '@/hooks/use-auth';
import { SupplierManagementModal } from './supplier-management-modal';

export type ViewType = 'dashboard' | 'pos';
export type ModalType =
  | 'payment'
  | 'receipt'
  | 'orders'
  | 'hospitality'
  | 'needs'
  | 'inventory'
  | 'categories'
  | 'reports'
  | 'statistics'
  | 'debts'
  | 'expenses'
  | 'accounting-fund'
  | 'employees'
  | 'recipes'
  | 'purchases'
  | 'settings'
  | 'accounts'
  | 'create-admin'
  | 'currencies'
  | 'branches'
  | 'banks'
  | 'raffle'
  | 'complaints'
  | 'customers'
  | 'email'
  | 'delivery'
  | 'online-orders'
  | 'peak-hours'
  | 'daily-summary'
  | 'coupons'
  | 'suppliers'
  | null;


export function AppContainer() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discount, setDiscount] = useState(0);
  const [lastPaymentMethod, setLastPaymentMethod] = useState<PaymentMethod>('نقدي');
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
  const [specialPrintCategoryId, setSpecialPrintCategoryId] = useState<string | null>(null);

  const [refreshPosData, setRefreshPosData] = useState<() => void>(() => () => {});


  useEffect(() => {
    // Set the default view based on user role
    if (user?.role === 'employee') {
      setActiveView('pos');
    } else {
      setActiveView('dashboard');
    }
  }, [user]);


  const { toast } = useToast();

  const handleAddToOrder = (product: Product, availableQuantity: number) => {
    setOrderItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < availableQuantity) {
            return prevItems.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            toast({ variant: "destructive", title: "الكمية غير كافية", description: `لا يمكن إضافة المزيد من ${product.name}.` });
            return prevItems;
        }
      }
      return [...prevItems, { ...product, quantity: 1, imageHint: product.imageHint || '' }];
    });
    toast({
      title: "تمت الإضافة إلى السلة",
      description: `تمت إضافة ${product.name}.`,
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromOrder(productId);
    } else {
      setOrderItems(prevItems =>
        prevItems.map(item => (item.id === productId ? { ...item, quantity } : item))
      );
    }
  };
  
  const handleUpdateNotes = (productId: string, notes: string) => {
    setOrderItems(prevItems =>
      prevItems.map(item => (item.id === productId ? { ...item, notes } : item))
    );
  };

  const handleRemoveFromOrder = (productId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const handleProcessPayment = () => {
    setActiveModal('payment');
  };

  const handlePaymentSuccess = (paymentMethod: PaymentMethod, bankName?: string, orderDetails?: any) => {
    setLastPaymentMethod(paymentMethod);
    setLastOrderDetails(orderDetails);
    setActiveModal('receipt');
  };

  const handleCloseReceipt = () => {
    setOrderItems([]);
    setDiscount(0);
    setActiveModal(null);
    if (refreshPosData) {
      refreshPosData();
    }
  };
  
  const openModal = (modal: ModalType) => {
    setActiveModal(modal);
  };
  
  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarNav setActiveModal={setActiveModal} setActiveView={setActiveView} />
      </Sidebar>
      <SidebarInset>
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'pos' && (
          <PosView
            orderItems={orderItems}
            onAddToOrder={handleAddToOrder}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateNotes={handleUpdateNotes}
            onRemoveFromOrder={handleRemoveFromOrder}
            onProcessPayment={handleProcessPayment}
            onNavigateToDashboard={() => setActiveView('dashboard')}
            discount={discount}
            onSetDiscount={setDiscount}
            setRefreshCallback={setRefreshPosData}
          />
        )}
      </SidebarInset>

      {activeModal === 'payment' && (
        <PaymentDialog
          isOpen={activeModal === 'payment'}
          onClose={() => setActiveModal(null)}
          onPaymentSuccess={handlePaymentSuccess}
          orderItems={orderItems}
          discount={discount}
          onSetDiscount={setDiscount}
        />
      )}

      {activeModal === 'receipt' && (
        <ReceiptModal
          isOpen={activeModal === 'receipt'}
          onClose={handleCloseReceipt}
          orderItems={orderItems}
          discount={discount}
          paymentMethod={lastPaymentMethod}
          specialPrintCategoryId={specialPrintCategoryId}
          orderDetails={lastOrderDetails}
        />
      )}

      {activeModal === 'orders' && (
        <OrdersLogModal
          isOpen={activeModal === 'orders'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'hospitality' && (
        <HospitalityLogModal
          isOpen={activeModal === 'hospitality'}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'needs' && (
        <NeedsModal
          isOpen={activeModal === 'needs'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'inventory' && (
        <InventoryModal
          isOpen={activeModal === 'inventory'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
       {activeModal === 'categories' && (
        <CategoriesModal
          isOpen={activeModal === 'categories'}
          onClose={() => setActiveModal(null)}
          specialPrintCategoryId={specialPrintCategoryId}
          setSpecialPrintCategoryId={setSpecialPrintCategoryId}
        />
      )}
      
      {activeModal === 'reports' && (
          <SalesReportModal
            isOpen={activeModal === 'reports'}
            onClose={() => setActiveModal(null)}
          />
      )}
      
      {activeModal === 'statistics' && (
          <StatisticsModal
            isOpen={activeModal === 'statistics'}
            onClose={() => setActiveModal(null)}
          />
      )}
      
       {activeModal === 'debts' && (
          <DebtsModal
            isOpen={activeModal === 'debts'}
            onClose={() => setActiveModal(null)}
          />
      )}
      
      {activeModal === 'expenses' && (
        <ExpensesModal
          isOpen={activeModal === 'expenses'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'accounting-fund' && (
        <AccountingFundModal
          isOpen={activeModal === 'accounting-fund'}
          onClose={() => setActiveModal(null)}
          openModal={openModal}
        />
      )}

      {activeModal === 'employees' && (
        <EmployeesModal
          isOpen={activeModal === 'employees'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'recipes' && (
        <RecipesModal
          isOpen={activeModal === 'recipes'}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'purchases' && (
        <PurchasesModal
          isOpen={activeModal === 'purchases'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'settings' && (
        <SettingsModal
          isOpen={activeModal === 'settings'}
          onClose={() => setActiveModal(null)}
          openModal={openModal}
        />
      )}
      
      {activeModal === 'accounts' && (
        <AccountsModal
          isOpen={activeModal === 'accounts'}
          onClose={() => setActiveModal(null)}
          openModal={openModal}
        />
      )}
      
      {activeModal === 'create-admin' && (
        <CreateAdminModal
          isOpen={activeModal === 'create-admin'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'currencies' && (
        <CurrenciesModal
          isOpen={activeModal === 'currencies'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
       {activeModal === 'branches' && (
        <BranchesModal
          isOpen={activeModal === 'branches'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'banks' && (
        <BanksModal
          isOpen={activeModal === 'banks'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'raffle' && (
        <RaffleModal
          isOpen={activeModal === 'raffle'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
       {activeModal === 'complaints' && (
        <ComplaintsModal
          isOpen={activeModal === 'complaints'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'customers' && (
        <CustomersModal
          isOpen={activeModal === 'customers'}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'coupons' && (
        <CouponsModal
          isOpen={activeModal === 'coupons'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'email' && (
        <EmailModal
          isOpen={activeModal === 'email'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'online-orders' && (
        <OnlineOrdersModal
          isOpen={activeModal === 'online-orders'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'peak-hours' && (
        <PeakHoursModal
          isOpen={activeModal === 'peak-hours'}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'daily-summary' && (
        <DailySummaryLogModal
          isOpen={activeModal === 'daily-summary'}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'suppliers' && (
        <SupplierManagementModal 
            isOpen={activeModal === 'suppliers'} 
            onClose={() => setActiveModal(null)}
            onSupplierUpdate={() => {
                // This is a placeholder. A real implementation would refetch suppliers
                // in the purchases modal. For now, we just close.
                setActiveModal(null);
            }}
        />
      )}

    </SidebarProvider>
  );
}
