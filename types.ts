
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PICKER = 'PICKER',
  CASHIER = 'CASHIER'
}

export enum OrderStatus {
  PENDING = 'PENDING', // 待处理
  PICKING_DONE = 'PICKING_DONE', // 备货完成/待付款
  COMPLETED = 'COMPLETED' // 已完成
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  spec: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  clientId: string; // 新增：客户端标识
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: number;
  updatedAt: number;
}

export interface StoreState {
  products: Product[];
  orders: Order[];
  currentRole: UserRole;
}
