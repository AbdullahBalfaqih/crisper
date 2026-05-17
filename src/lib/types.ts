export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  imageHint: string;
}

export interface Category {
  id:string;
  name: string;
}

export interface OrderItem extends Product {
  quantity: number;
  notes?: string;
}

export interface InventoryItem {
    inventoryId: number;
    productId: string;
    productName: string;
    quantity: number;
    lastUpdated: Date;
    price: number;
}
