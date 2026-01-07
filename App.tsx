
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, Product, Order, OrderStatus, OrderItem } from './types';
import { INITIAL_PRODUCTS } from './constants';
import RoleHeader from './components/RoleHeader';
import OrderManagement from './components/OrderManagement';
import VoiceAlert from './components/VoiceAlert';
import ProductManager from './components/ProductManager';
import { syncManager } from './store/SyncManager';
import { dbService } from './services/dbService';

import LoginModal from './components/LoginModal';

const App: React.FC = () => {
  const clientId = useMemo(() => {
    let id = sessionStorage.getItem('store_client_id');
    if (!id) {
      id = 'C-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      sessionStorage.setItem('store_client_id', id);
    }
    return id;
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // ...

  // Database Initialization
  useEffect(() => {
    const initDB = async () => {
      try {
        await dbService.init();
        const dbProducts = await dbService.getAll<Product>('products');
        const dbOrders = await dbService.getAll<Order>('orders');
        
        if (dbProducts.length === 0) {
          // Attempt to initialize default products
          // But first, we might want to ensure the table actually exists by calling a dummy endpoint if needed
          // For now, saveAll will trigger the table check on backend if we implement it correctly
          try {
            await dbService.saveAll('products', INITIAL_PRODUCTS);
            setProducts(INITIAL_PRODUCTS);
          } catch (e) {
            console.warn("Failed to init default products, maybe database is readonly or connecting...", e);
            // Don't block app start, just show empty list
            setProducts([]);
          }
        } else {
          setProducts(dbProducts);
        }
        setOrders(dbOrders);
        setDbReady(true);
      } catch (err: any) {
        console.error("System initialization failed:", err);
        setDbError(`系统初始化失败: ${err.message || '未知错误'}。请确保数据库已连接。`);
      }
    };
    initDB();
  }, []);

  if (dbError) return (
    <div className="flex h-screen items-center justify-center flex-col gap-4 p-8 text-center">
      <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 text-2xl mb-2">
        <i className="fas fa-exclamation-triangle"></i>
      </div>
      <div className="text-slate-800 font-black text-xl">系统启动失败</div>
      <p className="text-slate-500 max-w-md leading-relaxed">{dbError}</p>
      <div className="flex gap-4 mt-4">
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200">
          刷新重试
        </button>
        <a href="/api/init" target="_blank" className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">
          尝试手动初始化数据库
        </a>
      </div>
    </div>
  );

  if (!dbReady) return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <i className="fas fa-circle-notch fa-spin text-indigo-600 text-3xl"></i>
      <div className="text-slate-400 font-bold">数据库连接中...</div>
    </div>
  );

  // Sync mechanisms
  useEffect(() => {
    syncManager.subscribe((msg) => {
      if (msg.type === 'ORDER_UPDATE') {
        setOrders(msg.payload);
        if (currentRole !== UserRole.CUSTOMER) {
          setLastOrderAlert(true);
          setTimeout(() => setLastOrderAlert(false), 3000);
        }
      } else if (msg.type === 'PRODUCT_UPDATE') {
        setProducts(msg.payload);
      }
    });
    return () => syncManager.close();
  }, [currentRole]);

  const addToCart = (productId: string) => {
    setCart(prev => {
      const currentQty = (prev as Record<string, number>)[productId] || 0;
      return { ...prev, [productId]: currentQty + 1 };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const currentQty = (prev as Record<string, number>)[productId] || 0;
      const newVal = currentQty - 1;
      const updated = { ...prev };
      if (newVal <= 0) delete updated[productId];
      else updated[productId] = newVal;
      return updated;
    });
  };

  const submitOrder = async () => {
    const items: OrderItem[] = (Object.entries(cart) as [string, number][]).map(([id, qty]) => {
      const p = products.find(x => x.id === id)!;
      return { productId: id, name: p.name, quantity: qty, price: p.price };
    });

    const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      clientId: clientId,
      status: OrderStatus.PENDING,
      items,
      totalAmount: total,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const newOrders = [...orders, newOrder];
    await dbService.put('orders', newOrder);
    setOrders(newOrders);
    setCart({});
    setIsReviewingCart(false);
    syncManager.broadcast({ type: 'ORDER_UPDATE', payload: newOrders });
    alert("下单成功！请前往柜台。");
  };

  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const updatedOrder = { ...order, status: nextStatus, updatedAt: Date.now() };
      await dbService.put('orders', updatedOrder);
      const newOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
      setOrders(newOrders);
      syncManager.broadcast({ type: 'ORDER_UPDATE', payload: newOrders });
    }
  };

  const handleProductsChange = async (newProducts: Product[]) => {
    await dbService.saveAll('products', newProducts);
    setProducts(newProducts);
    syncManager.broadcast({ type: 'PRODUCT_UPDATE', payload: newProducts });
  };

  // UI calculations
  const categories = useMemo(() => ['全部', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const filteredProducts = products.filter(p => 
    (category === '全部' || p.category === category) &&
    (p.name.includes(searchQuery) || p.category.includes(searchQuery))
  );

  const cartCount = (Object.values(cart) as number[]).reduce((a, b) => a + b, 0);
  const cartTotal = (Object.entries(cart) as [string, number][]).reduce((acc, [id, qty]) => {
    const p = products.find(x => x.id === id);
    return acc + (p?.price || 0) * qty;
  }, 0);

  const myPendingOrders = useMemo(() => {
    return orders.filter(o => o.clientId === clientId && o.status !== OrderStatus.COMPLETED);
  }, [orders, clientId]);

  if (!dbReady) return <div className="flex h-screen items-center justify-center text-slate-400 font-bold">数据库启动中...</div>;

  const renderCustomer = () => (
    <div className="pb-32">
      {myPendingOrders.length > 0 && (
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl border-2 border-indigo-100 p-4 shadow-sm">
            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fas fa-spinner fa-spin"></i> 我的订单实时状态
            </h3>
            <div className="space-y-3">
              {myPendingOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-slate-700">单号 #{order.id.slice(-4)}</span>
                    <span className="ml-2 text-sm font-bold text-rose-500">¥{order.totalAmount.toFixed(1)}</span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                    order.status === OrderStatus.PENDING ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600 animate-pulse'
                  }`}>
                    {order.status === OrderStatus.PENDING ? '正在搬货中' : '备货已完成/请付钱'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-16 z-40 bg-slate-50/90 backdrop-blur-md px-4 py-4 space-y-3">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" placeholder="搜索商品..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-6 py-2 rounded-xl text-sm font-black transition-all ${
                category === cat ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 mt-2">
        {filteredProducts.map(p => {
          const itemQty = (cart as Record<string, number>)[p.id] || 0;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
              <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => setShowProductModal(p)}>
                <img src={p.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="p-3 flex flex-col flex-grow">
                <h3 className="font-bold text-slate-800 text-sm">{p.name}</h3>
                <p className="text-[10px] text-slate-400 mb-2">{p.spec} | {p.unit}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-lg font-black text-rose-500">¥{p.price.toFixed(1)}</span>
                  <div className="flex items-center gap-2">
                    {itemQty > 0 && (
                      <button onClick={() => removeFromCart(p.id)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <i className="fas fa-minus text-xs"></i>
                      </button>
                    )}
                    {itemQty > 0 && <span className="font-black text-sm">{itemQty}</span>}
                    <button onClick={() => addToCart(p.id)} className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
                      <i className="fas fa-plus text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cartCount > 0 && !isReviewingCart && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-50">
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl ring-4 ring-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-xl">
                <i className="fas fa-shopping-basket"></i>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black">已选 {cartCount} 件</p>
                <p className="text-2xl font-black">¥{cartTotal.toFixed(2)}</p>
              </div>
            </div>
            <button onClick={() => setIsReviewingCart(true)} className="bg-indigo-500 px-6 py-3 rounded-xl font-black flex items-center gap-2">
              核对清单
            </button>
          </div>
        </div>
      )}

      {isReviewingCart && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">确认订单内容</h2>
              <button onClick={() => setIsReviewingCart(false)} className="text-slate-400"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {(Object.entries(cart) as [string, number][]).map(([id, qty]) => {
                const p = products.find(x => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <img src={p.image} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-bold text-sm">{p.name}</h4>
                        <p className="text-[10px] text-slate-400">¥{p.price.toFixed(1)}/{p.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-700">x{qty}</span>
                      <p className="font-black text-slate-900 text-sm">¥{(p.price * qty).toFixed(1)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-6 bg-slate-50 border-t rounded-t-3xl">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-slate-500 font-bold text-lg">合计金额</span>
                <span className="text-4xl font-black text-rose-500">¥{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsReviewingCart(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold">修改</button>
                <button onClick={submitOrder} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg text-lg">确认提交</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStaff = () => (
    <div className="p-4 max-w-3xl mx-auto space-y-8">
      {currentRole === UserRole.CASHIER && (
        <section className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
           <ProductManager products={products} onUpdate={handleProductsChange} />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800">实时任务看板</h2>
          <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-slate-500">DB同步正常</span>
          </div>
        </div>
        <OrderManagement orders={orders} role={currentRole} onAction={updateOrderStatus} />
      </section>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      {isAdmin && (
        <RoleHeader 
          currentRole={currentRole} 
          onRoleChange={setCurrentRole}
          onLogout={() => {
            if (window.confirm('确定退出管理模式吗？')) {
              setIsAdmin(false);
              setCurrentRole(UserRole.CUSTOMER);
            }
          }}
        />
      )}
      
      <main className={`max-w-7xl mx-auto pt-4 ${!isAdmin ? 'mt-4' : ''}`}>
        {currentRole === UserRole.CUSTOMER ? renderCustomer() : renderStaff()}
      </main>

      {/* Admin Login Trigger (Hidden for customers) */}
      {!isAdmin && (
        <button 
          onClick={() => setShowLogin(true)}
          className="fixed bottom-4 right-4 w-8 h-8 opacity-20 hover:opacity-100 transition-opacity bg-slate-200 rounded-full flex items-center justify-center text-slate-500 z-10"
        >
          <i className="fas fa-cog"></i>
        </button>
      )}

      {/* Login Modal */}
      {showLogin && (
        <LoginModal 
          onLogin={(success) => {
            if (success) {
              setIsAdmin(true);
              setShowLogin(false);
              setCurrentRole(UserRole.CASHIER); // Auto switch to cashier role
            }
          }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showProductModal && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4" onClick={() => setShowProductModal(null)}>
          <div className="max-w-full relative" onClick={e => e.stopPropagation()}>
            <img src={showProductModal.image} className="rounded-3xl max-h-[60vh] mx-auto shadow-2xl border-4 border-white" />
            <div className="bg-white p-8 mt-6 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-black text-slate-900">{showProductModal.name}</h2>
              <p className="text-slate-500 font-bold text-xl mt-2">{showProductModal.spec} | {showProductModal.category}</p>
              <div className="flex items-center justify-between mt-8">
                <span className="text-4xl font-black text-rose-500">¥{showProductModal.price.toFixed(2)}<span className="text-sm font-medium text-slate-400 ml-2">/{showProductModal.unit}</span></span>
                <button onClick={() => {addToCart(showProductModal.id); setShowProductModal(null);}} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-lg shadow-indigo-200">
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <VoiceAlert shouldAlert={lastOrderAlert} message="您有新的订单，请及时处理。" />
    </div>
  );
};

export default App;
