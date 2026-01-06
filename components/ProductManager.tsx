import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { dbService } from '../services/dbService';

interface ProductManagerProps {
  products: Product[];
  onUpdate: (products: Product[]) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, onUpdate }) => {
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await dbService.getAll<Category>('categories');
    setCategories(cats);
  };

  const saveProduct = () => {
    if (!editing?.name || !editing?.price) return;
    
    let newProducts: Product[];
    if (editing.id) {
      newProducts = products.map(p => p.id === editing.id ? (editing as Product) : p);
    } else {
      const newProduct: Product = {
        ...(editing as Product),
        id: 'p' + Date.now(),
        image: editing.image || 'https://picsum.photos/400/300'
      };
      newProducts = [...products, newProduct];
    }
    onUpdate(newProducts);
    setEditing(null);
  };

  const deleteProduct = (id: string) => {
    if (window.confirm('确定删除该商品吗？')) {
      onUpdate(products.filter(p => p.id !== id));
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newCat = {
      id: 'c' + Date.now(),
      name: newCategoryName.trim()
    };
    await dbService.put('categories', newCat);
    await loadCategories();
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  const deleteCategory = async (id: string) => {
    if (window.confirm('确定删除该类别吗？')) {
      await dbService.delete('categories', id);
      await loadCategories();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const path = await dbService.uploadFile(file);
        setEditing(prev => prev ? ({ ...prev, image: path }) : null);
      } catch (error) {
        alert('图片上传失败，请重试');
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-800">商品资料库</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200"
          >
            <i className="fas fa-tags"></i> 类别管理
          </button>
          <button 
            onClick={() => setEditing({ name: '', price: 0, unit: '斤', category: categories[0]?.name || '其他', spec: '', image: '' })}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> 新增商品
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 items-center">
            <img src={p.image} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-grow">
              <h4 className="font-bold text-slate-800">{p.name}</h4>
              <p className="text-xs text-slate-400">{p.spec} | ¥{p.price}/{p.unit}</p>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md mt-1 inline-block">
                {p.category}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                <i className="fas fa-edit"></i>
              </button>
              <button onClick={() => deleteProduct(p.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-4">类别管理</h3>
            <div className="flex gap-2 mb-4">
              <input 
                placeholder="新类别名称" 
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <button onClick={addCategory} className="bg-indigo-600 text-white px-4 rounded-xl font-bold">
                添加
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-700">{cat.name}</span>
                  <button onClick={() => deleteCategory(cat.id)} className="text-rose-500 hover:bg-rose-100 p-2 rounded-lg">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button onClick={() => setShowCategoryModal(false)} className="w-full py-3 font-bold text-slate-500 bg-slate-100 rounded-xl">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-4">{editing.id ? '编辑商品' : '新增商品'}</h3>
            <div className="space-y-4">
              <input 
                placeholder="商品名称" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={editing.name}
                onChange={e => setEditing({...editing, name: e.target.value})}
              />
              <div className="flex gap-3">
                <input 
                  type="number" 
                  placeholder="单价" 
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={editing.price}
                  onChange={e => setEditing({...editing, price: parseFloat(e.target.value)})}
                />
                <input 
                  placeholder="单位" 
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={editing.unit}
                  onChange={e => setEditing({...editing, unit: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block ml-1">所属类别</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={editing.category}
                  onChange={e => setEditing({...editing, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <input 
                placeholder="规格说明" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={editing.spec}
                onChange={e => setEditing({...editing, spec: e.target.value})}
              />
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 ml-1">商品图片</label>
                <div className="flex gap-2 items-center">
                  {editing.image && (
                    <img src={editing.image} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                  )}
                  <label className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100 cursor-pointer">
                    <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-semibold hover:bg-indigo-100 transition-colors inline-block">
                      {editing.image ? '更换图片' : '上传图片'}
                    </span>
                    <input 
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 font-bold text-slate-500">取消</button>
              <button onClick={saveProduct} className="flex-2 py-3 bg-indigo-600 text-white rounded-xl font-black">保存资料</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;