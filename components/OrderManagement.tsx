
import React from 'react';
import { Order, OrderStatus, UserRole } from '../types';

interface OrderManagementProps {
  orders: Order[];
  role: UserRole;
  onAction: (orderId: string, nextStatus: OrderStatus) => void;
  onDelete?: (orderId: string) => void;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, role, onAction, onDelete }) => {
  const filteredOrders = orders.filter(o => 
    o.status !== OrderStatus.COMPLETED || role === UserRole.CASHIER
  ).sort((a, b) => b.updatedAt - a.updatedAt);

  const getBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-orange-100 text-orange-700 border-orange-200';
      case OrderStatus.PICKING_DONE: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return '待备货';
      case OrderStatus.PICKING_DONE: return '待付款';
      case OrderStatus.COMPLETED: return '已完成';
    }
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <i className="fas fa-clipboard-list text-6xl mb-4 opacity-20"></i>
        <p className="text-xl font-medium">暂无待处理订单</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredOrders.map(order => (
        <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-lg font-bold text-slate-900">#{order.id.slice(-4)}</span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getBadgeClass(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {new Date(order.createdAt).toLocaleTimeString()} 下单
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-slate-900">¥{order.totalAmount.toFixed(2)}</p>
              <p className="text-xs text-slate-400">{order.items.reduce((acc, i) => acc + i.quantity, 0)} 件商品</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2 border border-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-slate-700 font-medium">
                   {item.name} <span className="text-slate-400 text-xs ml-1">x{item.quantity}</span>
                </span>
                <span className="text-slate-500">¥{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {onDelete && role === UserRole.CASHIER && (
              <button
                onClick={() => {
                  if (window.confirm('确定要删除此订单吗？')) {
                    onDelete(order.id);
                  }
                }}
                className="w-14 bg-rose-100 text-rose-600 rounded-xl font-bold shadow-sm active:scale-95 transition-all text-lg flex items-center justify-center"
                title="删除订单"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            )}
            
            {order.status === OrderStatus.PENDING && (role === UserRole.PICKER || role === UserRole.CASHIER) && (
              <button
                onClick={() => onAction(order.id, OrderStatus.PICKING_DONE)}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all text-lg"
              >
                <i className="fas fa-check-circle mr-2"></i> 备货完成
              </button>
            )}
            
            {order.status === OrderStatus.PICKING_DONE && role === UserRole.CASHIER && (
              <button
                onClick={() => onAction(order.id, OrderStatus.COMPLETED)}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 active:scale-95 transition-all text-lg"
              >
                <i className="fas fa-money-bill-wave mr-2"></i> 确认结账
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderManagement;
