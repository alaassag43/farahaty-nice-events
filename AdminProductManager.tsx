import React, { useState } from 'react';
import { dbOperation, uploadFile } from './lib/firebase';
import { Product } from './types';
import { Plus, Edit2, Trash2, CheckCircle, X, Box, ToggleRight, Save, AlertCircle, ToggleLeft } from 'lucide-react';

function AdminProductManager({ products, categories, onRefresh, isDarkMode, setProducts }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    images: [],
    isAvailable: true,
    stock: 1,
    specifications: { size: '', includesInstallation: true, accessories: [] }
  });

  const handleSave = async () => {
    if (!form.name || !form.categoryId) return alert('يرجى ملء البيانات الأساسية');
    const id = editingId || `p-${Date.now()}`;
    const productData = {
      ...form,
      id,
      images: form.images.length ? form.images : ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800']
    };
    await dbOperation('set', 'products', productData, id);
    alert('Saved Successfully!');
    // Immediate UI update
    setProducts(prev => editingId ? prev.map(p => p.id === id ? productData : p) : [...prev, productData]);
    onRefresh();
    setIsAdding(false);
    setEditingId(null);
    setForm({ name: '', description: '', price: 0, categoryId: '', images: [], isAvailable: true, stock: 1, specifications: { size: '', includesInstallation: true, accessories: [] } });
  };

  const handleEdit = (p: any) => {
    setForm(p);
    setEditingId(p.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه القطعة من المخزون؟')) {
      await dbOperation('delete', 'products', null, id);
      // Immediate UI update
      setProducts(prev => prev.filter(p => p.id !== id));
      onRefresh();
    }
  };

  return (
    <div className={`p-6 space-y-8 text-right pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''} animate-fade`}>
        <div className="flex justify-between items-center">
          <button onClick={() => setIsAdding(true)} className="bg-pink-600 text-white px-8 py-4 rounded-3xl font-black italic shadow-xl hover:bg-pink-700 transition-colors flex items-center gap-2">
            <Plus size={20}/> إضافة منتج جديد
          </button>
          <div className="text-right">
              <h2 className="text-3xl font-black italic">المخزون الملكي</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">إدارة قطع الأثاث والديكور</p>
          </div>
        </div>

        {isAdding && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
             <div className={`w-full max-w-2xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                   <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24}/></button>
                   <h3 className="text-xl font-black italic text-pink-600">{editingId ? 'تعديل قطعة' : 'إضافة قطعة ملكية'}</h3>
                </div>

                <div className="space-y-6">
                   <SectionInput label="اسم المنتج" value={form.name} onChange={(v:any)=>setForm({...form, name:v})} isDarkMode={isDarkMode} />
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 pr-4 uppercase">التصنيف</p>
                          <select 
                             className={`w-full p-6 rounded-[1.5rem] font-bold text-sm outline-none text-right shadow-inner appearance-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-transparent text-gray-900'}`} 
                             value={form.categoryId} 
                             onChange={e=>setForm({...form, categoryId:e.target.value})}
                          >
                             <option value="">اختر التصنيف</option>
                             {categories.map((c:any)=><option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                       </div>
                       <SectionInput label="السعر (ر.س)" value={form.price} onChange={(v:any)=>setForm({...form, price:Number(v)})} type="number" isDarkMode={isDarkMode} />
                   </div>

                   <SectionInput label="وصف المنتج" value={form.description} onChange={(v:any)=>setForm({...form, description:v})} type="textarea" isDarkMode={isDarkMode} />

                   <div className="grid grid-cols-2 gap-4">
                       <SectionInput label="الكمية المتوفرة" value={form.stock} onChange={(v:any)=>setForm({...form, stock:Number(v)})} type="number" isDarkMode={isDarkMode} />
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 pr-4 uppercase">حالة العرض</p>
                          <button 
                             onClick={() => setForm({...form, isAvailable: !form.isAvailable})}
                             className={`w-full p-6 rounded-[1.5rem] flex items-center justify-between font-bold text-sm transition-all ${form.isAvailable ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                          >
                             <span>{form.isAvailable ? 'متوفر حالياً' : 'غير متوفر'}</span>
                             {form.isAvailable ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                          </button>
                       </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 pr-4 uppercase">رفع الصورة</p>
                      <div className="space-y-3">
                         <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                  try {
                                     const imageUrl = await uploadFile(file, 'products');
                                     setForm({...form, images: [imageUrl]});
                                  } catch (error) {
                                     alert('فشل في رفع الصورة: ' + error.message);
                                  }
                               }
                            }}
                            className={`w-full p-4 rounded-[1.5rem] font-bold text-sm outline-none text-right shadow-inner file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white file:bg-gray-700 file:text-gray-200' : 'bg-gray-50 border-transparent text-gray-900'}`}
                         />
                         {form.images[0] && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                               <CheckCircle size={20} className="text-green-600" />
                               <span className="text-sm font-medium text-green-700">تم رفع الصورة بنجاح</span>
                            </div>
                         )}
                      </div>
                   </div>

                   <div className="flex gap-4 pt-10">
                      <button onClick={()=>setIsAdding(false)} className={`flex-1 py-6 rounded-[2rem] font-black italic ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>إلغاء</button>
                      <button onClick={handleSave} className="flex-[2] py-6 bg-black text-white rounded-[2rem] font-black italic shadow-xl hover:bg-pink-600 transition-all flex items-center justify-center gap-2">
                         <Save size={20}/> {editingId ? 'تحديث البيانات' : 'إضافة للمخزون'}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {products.map((p: any) => (
             <div key={p.id} className={`group relative flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-[2.5rem] border shadow-sm overflow-hidden transition-all hover:shadow-xl`}>
                {/* Availability Badge */}
                <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg ${p.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {p.isAvailable ? <CheckCircle size={10}/> : <AlertCircle size={10}/>}
                  {p.isAvailable ? 'متوفر' : 'غير متاح'}
                </div>

                <div className="h-48 overflow-hidden relative">
                   <img src={p.images?.[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={()=>handleEdit(p)} className="p-4 bg-white text-black rounded-2xl shadow-xl hover:bg-pink-500 hover:text-white transition-all"><Edit2 size={18}/></button>
                      <button onClick={()=>handleDelete(p.id)} className="p-4 bg-white text-red-500 rounded-2xl shadow-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                   </div>
                </div>

                <div className="p-6 text-right flex-1 flex flex-col justify-between">
                   <div>
                      <span className="text-[8px] font-black text-pink-600 uppercase tracking-widest">{p.categoryId}</span>
                      <h4 className={`text-sm font-black mt-1 line-clamp-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{p.name}</h4>
                   </div>
                   <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-600">
                         <span className="text-[10px] font-bold">مخزون: {p.stock}</span>
                      </div>
                      <span className="text-lg font-black italic text-pink-600">{p.price} <span className="text-[10px]">ر.س</span></span>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {products.length === 0 && (
           <div className="text-center py-40 opacity-20 flex flex-col items-center">
              <Box size={80} className="mb-4" />
              <p className="text-xl font-black italic">المخزون فارغ تماماً</p>
           </div>
        )}
    </div>
  );
}

function SectionInput({ label, value, onChange, isDarkMode, type = 'text', info, placeholder }: any) {
    const InputComponent = type === 'textarea' ? 'textarea' : 'input';
    return (
        <div className="space-y-2 text-right">
            <p className="text-[10px] font-black text-gray-400 pr-4 uppercase">{label}</p>
            <InputComponent
                type={type === 'textarea' ? undefined : type}
                value={value}
                onChange={(e: any) => onChange(e.target.value)}
                placeholder={placeholder || label}
                rows={type === 'textarea' ? 4 : undefined}
                className={`w-full p-5 rounded-[1.5rem] font-bold text-sm outline-none text-right shadow-inner resize-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-transparent text-gray-900'} ${type === 'textarea' ? 'pt-4' : ''}`}
            />
            {info && <p className={`text-[8px] font-medium text-gray-500 pr-4 mt-1`}>{info}</p>}
        </div>
    );
}

export default AdminProductManager;
