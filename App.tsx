
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Link, useLocation, useParams, Navigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  Home, ShoppingCart, User, LogOut, LayoutDashboard, Box, 
  Calendar, Settings, Plus, Trash2, CheckCircle, QrCode, 
  MessageCircle, X, Camera, Clock, Edit2, UserCheck, 
  Menu, Send, TrendingUp, Layers, Sun, Moon, BarChart3, 
  Save, Eye, UserPlus, Key, MapPin, ArrowRight, Star, Printer, ChevronLeft,
  MessageSquare, Folders, Search, Info, Download, Copy, Share2, Filter, ShoppingBag,
  Image as ImageIcon, ToggleLeft, ToggleRight, AlertCircle
} from 'lucide-react';

import { Product, Category, Section, Booking, UserRole, AppContent, CustomerCode, ChatMessage } from './types';
import { INITIAL_PRODUCTS, INITIAL_CONTENT } from './constants';
import { supabase, supabaseOperation } from './lib/supabase';

const saveToLocal = (key: string, data: any) => localStorage.setItem(`nice_v5_${key}`, JSON.stringify(data));
const getFromLocal = (key: string, fallback: any) => {
  const saved = localStorage.getItem(`nice_v5_${key}`);
  try { return saved ? JSON.parse(saved) : fallback; } catch { return fallback; }
};

export default function App() {
  const [role, setRole] = useState<UserRole | null>(() => getFromLocal('userRole', null));
  const [userSession, setUserSession] = useState<CustomerCode | null>(() => getFromLocal('userSession', null));
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerCodes, setCustomerCodes] = useState<CustomerCode[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState<AppContent>(INITIAL_CONTENT);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>(() => getFromLocal('cart', []));
  const [isDarkMode, setIsDarkMode] = useState(() => getFromLocal('darkMode', false));
  const [msg, setMsg] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setMsg({ message, type });

  // إعداد التزامن اللحظي مع Supabase
  useEffect(() => {
    const setupSync = async () => {
      // 1. جلب البيانات الأولية
      const [catsRes, prodsRes, codesRes, bksRes, msgsRes, appContentRes] = await Promise.all([
        supabaseOperation('get', 'categories'),
        supabaseOperation('get', 'products'),
        supabaseOperation('get', 'customer_codes'),
        supabaseOperation('get', 'bookings'),
        supabaseOperation('get', 'chat_messages'),
        supabaseOperation('get', 'app_content'),
      ]);

      if ((catsRes as any).success) setCategories((catsRes as any).data || []);
      else setCategories([]);
      if ((prodsRes as any).success) setProducts((prodsRes as any).data || []);
      else setProducts([]);
      if ((codesRes as any).success) setCustomerCodes((codesRes as any).data || []);
      else setCustomerCodes([]);
      if ((bksRes as any).success) setBookings((bksRes as any).data || []);
      else setBookings([]);
      if ((msgsRes as any).success) setChatMessages((msgsRes as any).data || []);
      else setChatMessages([]);
      if ((appContentRes as any).success && (appContentRes as any).data && (appContentRes as any).data.length > 0) setContent((appContentRes as any).data[0]);
      else setContent(INITIAL_CONTENT);

      setIsLoading(false);

      // 2. الاشتراك في التغييرات اللحظية
      const channel = supabase
        .channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          const { table, eventType, new: newRow, old: oldRow } = payload;
          
          const updateState = (prev: any[]) => {
            if (eventType === 'INSERT') return [newRow, ...prev];
            if (eventType === 'UPDATE') return prev.map(item => item.id === newRow.id ? newRow : item);
            if (eventType === 'DELETE') return prev.filter(item => item.id === oldRow.id);
            return prev;
          };

          switch (table) {
            case 'products': setProducts(prev => updateState(prev)); break;
            case 'categories': setCategories(prev => updateState(prev)); break;
            case 'codes': 
              setCustomerCodes(prev => {
                const updated = updateState(prev);
                if (userSession) {
                  const current = updated.find(c => c.id === userSession.id);
                  if (current) setUserSession(current);
                }
                return updated;
              }); 
              break;
            case 'bookings': setBookings(prev => updateState(prev)); break;
            case 'chat_messages': setChatMessages(prev => updateState(prev)); break;
            case 'app_content': if (newRow) setContent(newRow); break;
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSync();
  }, [userSession?.id]);

  useEffect(() => {
    saveToLocal('userRole', role);
    saveToLocal('userSession', userSession);
    saveToLocal('cart', cart);
    saveToLocal('darkMode', isDarkMode);
  }, [role, userSession, cart, isDarkMode]);

  const handleVerify = async (code: string) => {
    if (code === (content.admin_password || 'ADMIN123')) {
      setRole(UserRole.ADMIN); navigate('/admin');
      showToast('مرحباً بك في مركز التحكم الإداري'); return;
    }
    const found = customerCodes.find(c => c.code === code && c.isActive);
    if (found) {
      setRole(UserRole.USER); setUserSession(found);
      navigate('/store'); showToast(`أهلاً بك ${found.customerName}`); return;
    }
    showToast('الكود غير صحيح أو غير مفعل حالياً', 'error');
  };

  const handleLogout = () => {
    setRole(null); setUserSession(null); setCart([]);
    setIsAdminDrawerOpen(false); navigate('/access');
    showToast('تم تسجيل الخروج بنجاح');
  };

  const handleCheckout = async (total: number) => {
    if (!userSession) return;
    const id = `BOK-${Date.now()}`;
    const newBooking: Booking = {
      id,
      userId: userSession.id,
      userName: userSession.customerName,
      userPhone: userSession.userPhone || '',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      status: 'Pending',
      totalPrice: total,
      location: 'سيتم التحديد عند التواصل',
      createdAt: new Date().toISOString(),
      items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity, name: i.product.name })),
      depositAmount: total * 0.2
    };
    const res = await supabaseOperation('set', 'bookings', newBooking, id);
    if (!res.success) {
      showToast(res.error, 'error');
      return;
    }
    setCart([]);
    navigate(`/booking-status/${id}`);
    showToast('تم إرسال طلب الحجز بنجاح');
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
  if (isLoading) return <LoadingScreen />;

  const showHeader = role && !['/access', '/login', '/access-pending'].includes(location.pathname);
  const showUserNav = role === UserRole.USER && !['/access', '/login', '/access-pending'].includes(location.pathname);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} transition-all duration-300`}>
      {msg && <Toast message={msg.message} type={msg.type} onClose={() => setMsg(null)} />}
      
      {showHeader && (
        <header className={`sticky top-0 z-[200] ${isDarkMode ? 'bg-gray-950/90 border-gray-800' : 'bg-white/90 border-gray-100'} backdrop-blur-xl border-b px-6 py-5 flex justify-between items-center shadow-sm no-print`}>
          <div className="flex items-center gap-4">
            {role === UserRole.ADMIN ? (
              <button onClick={() => setIsAdminDrawerOpen(true)} className="p-3 bg-black text-white rounded-2xl active:scale-95 transition-transform"><Menu size={22} /></button>
            ) : (
              <div className="w-12 h-12 bg-pink-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-sm shadow-xl border-2 border-white">{userSession?.customerName?.charAt(0) || 'U'}</div>
            )}
            <Link to="/" className="flex flex-col">
              <span className="font-black text-pink-600 text-lg italic leading-none tracking-tighter">Nice Events</span>
              <span className="text-[8px] font-black text-amber-600 uppercase tracking-[0.3em]">فرحتي لتنسيق المناسبات</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-gray-50 rounded-2xl active:scale-90 transition-transform">{isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-gray-400" />}</button>
            <button onClick={() => setIsSupportOpen(true)} className="p-3 bg-pink-50 text-pink-600 rounded-2xl relative active:scale-90 transition-transform">
               <MessageSquare size={20} />
               {chatMessages.filter(m => !m.is_read && m.sender_type === 'customer' && role === UserRole.ADMIN).length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
            </button>
            {role === UserRole.USER && (
              <Link to="/cart" className="p-3 bg-black text-white rounded-2xl relative active:scale-90 transition-transform">
                <ShoppingCart size={20} />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-[9px] flex items-center justify-center font-black border-2 border-white">{cart.length}</span>}
              </Link>
            )}
          </div>
        </header>
      )}

      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/" element={role ? <Navigate to={role === UserRole.ADMIN ? "/admin" : "/store"} replace /> : <Navigate to="/access" replace />} />
          <Route path="/access" element={<AccessGateView onVerify={handleVerify} onScan={() => setIsScannerOpen(true)} onRequest={async (n, p) => {
            const id = `USR-${Date.now()}`;
            await supabaseOperation('set', 'codes', { id, customerName: n, userPhone: p, status: 'pending', isActive: false, walletBalance: 0, code: 'PENDING', createdAt: new Date().toISOString() }, id);
            navigate('/access-pending');
          }} isDarkMode={isDarkMode} />} />
          <Route path="/access-pending" element={<AccessPendingView isDarkMode={isDarkMode} />} />
          <Route path="/login" element={<AdminLoginView onLogin={handleVerify} />} />
          
          <Route path="/store" element={<ProtectedRoute role={role}><StoreHomeView products={products} categories={categories} onAdd={p => {
             setCart(prev => {
                const ex = prev.find(i => i.product.id === p.id);
                if (ex) return prev.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
                return [...prev, { product: p, quantity: 1 }];
             });
             showToast('تمت إضافة القطعة للسلة الملكية');
          }} isDarkMode={isDarkMode} /></ProtectedRoute>} />

          <Route path="/bookings" element={<ProtectedRoute role={role}><UserBookingsView bookings={bookings} userId={userSession?.id} isDarkMode={isDarkMode} /></ProtectedRoute>} />
          
          <Route path="/admin/*" element={<ProtectedRoute role={role} adminOnly><AdminRoutes products={products} categories={categories} bookings={bookings} codes={customerCodes} content={content} onRefresh={() => {}} isDarkMode={isDarkMode} /></ProtectedRoute>} />
          
          <Route path="/cart" element={<ProtectedRoute role={role}><CartPageView cart={cart} onCheckout={handleCheckout} onRemove={(id) => setCart(prev => prev.filter(i => i.product.id !== id))} isDarkMode={isDarkMode} /></ProtectedRoute>} />
          <Route path="/booking-status/:id" element={<ProtectedRoute role={role}><BookingStatusView bookings={bookings} products={products} isDarkMode={isDarkMode} /></ProtectedRoute>} />
        </Routes>
      </main>

      {showUserNav && <UserBottomNav cartCount={cart.length} onLogout={handleLogout} />}

      {role && <AdminDrawer isOpen={isAdminDrawerOpen} onClose={() => setIsAdminDrawerOpen(false)} onLogout={handleLogout} isDarkMode={isDarkMode} />}
      
      <SupportChatModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} messages={chatMessages} onSend={async t => {
        const id = `MSG-${Date.now()}`;
        await supabaseOperation('set', 'chat_messages', {
          id,
          customer_code_id: role === UserRole.ADMIN ? null : userSession?.id,
          sender_type: role === UserRole.ADMIN ? 'admin' : 'customer',
          message: t,
          is_read: false
        }, id);
      }} user={userSession} role={role} isDarkMode={isDarkMode} />
      
      <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleVerify} />
    </div>
  );
}

// --- Admin Product Manager ---

function AdminProductManager({ products, categories, onRefresh, isDarkMode }: any) {
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
    await supabaseOperation('set', 'products', productData, id);
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
      await supabaseOperation('delete', 'products', null, id);
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
                     <p className="text-[10px] font-black text-gray-400 pr-4 uppercase">رابط الصورة (URL)</p>
                     <div className="flex gap-2">
                        <input 
                           className={`flex-1 p-6 rounded-[1.5rem] font-bold text-sm outline-none text-right shadow-inner ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-transparent text-gray-900'}`} 
                           placeholder="ضع رابط الصورة هنا..."
                           value={form.images[0] || ''} 
                           onChange={e => setForm({...form, images: [e.target.value]})}
                        />
                        <div className={`p-6 rounded-[1.5rem] flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                           <ImageIcon size={20} className="text-gray-400"/>
                        </div>
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

// --- Admin Category Manager ---

function AdminCategoryManager({ categories, onRefresh, isDarkMode }: any) {
  const [newCat, setNewCat] = useState('');
  const handleAdd = async () => {
    if (!newCat.trim()) return;
    const id = `cat-${Date.now()}`;
    await supabaseOperation('set', 'categories', { id, name: newCat, sections: [] }, id);
    setNewCat('');
    onRefresh();
  };
  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      await supabaseOperation('delete', 'categories', null, id);
      onRefresh();
    }
  };
  return (
    <div className={`p-6 space-y-8 text-right animate-fade ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
       <h2 className="text-3xl font-black italic">إدارة الأقسام الملكية</h2>
       <div className="flex gap-4">
          <button onClick={handleAdd} className="bg-pink-600 text-white px-8 py-4 rounded-2xl font-black italic shadow-xl hover:bg-pink-700 transition-colors">إضافة قسم</button>
          <input 
            className={`flex-1 p-5 rounded-2xl text-right outline-none border-2 border-transparent focus:border-pink-500 transition-all shadow-inner font-bold text-sm ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 border-transparent text-gray-900'}`} 
            placeholder="اسم القسم الجديد (مثلاً: كوشات، صوتيات...)" 
            value={newCat} 
            onChange={e => setNewCat(e.target.value)} 
          />
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c: any) => (
             <div key={c.id} className={`p-6 rounded-[2.5rem] border flex items-center justify-between shadow-sm transition-all hover:shadow-md ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <button onClick={() => handleDelete(c.id)} className="text-red-500 p-3 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
                <div className="text-right">
                   <span className="font-black italic text-lg">{c.name}</span>
                </div>
             </div>
          ))}
       </div>
       {categories.length === 0 && (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
             <Folders size={60} className="mb-4" />
             <p className="font-black italic">لا يوجد أقسام مضافة بعد</p>
          </div>
       )}
    </div>
  );
}

// --- Admin Routes & Components (Updated with full theme support) ---

function AdminRoutes({ products, categories, bookings, codes, content, onRefresh, isDarkMode }: any) {
  return (
    <Routes>
      <Route index element={<AdminDashboardView bookings={bookings} codes={codes} products={products} isDarkMode={isDarkMode} />} />
      <Route path="products" element={<AdminProductManager products={products} categories={categories} onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
      <Route path="categories" element={<AdminCategoryManager categories={categories} onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
      <Route path="bookings" element={<AdminBookingManager bookings={bookings} onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
      <Route path="codes" element={<AdminCodesManager codes={codes} onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
      <Route path="card-generator" element={<AdminCardGenerator onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
      <Route path="reports" element={<AdminReportsView bookings={bookings} isDarkMode={isDarkMode} />} />
      <Route path="settings" element={<AdminSettingsView content={content} onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
    </Routes>
  );
}

function AdminCardGenerator({ onRefresh, isDarkMode }: any) {
  const [customerName, setCustomerName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!customerName.trim()) return alert('يرجى إدخال اسم العميل');
    const newCode = `NICE-${Math.floor(1000 + Math.random() * 8999)}`;
    const id = `C-${Date.now()}`;
    const qr = await QRCode.toDataURL(newCode, { margin: 1, width: 400 });
    setGeneratedCode(newCode);
    setQrDataUrl(qr);
    await supabaseOperation('set', 'customer_codes', { id, code: newCode, customerName, isActive: true, status: 'approved', createdAt: new Date().toISOString(), walletBalance: 0 }, id);
    onRefresh();
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
    const pdf = new jsPDF('p', 'mm', [105, 148]);
    pdf.addImage(dataUrl, 'PNG', 0, 0, 105, 148);
    pdf.save(`Nice-Event-Card-${customerName}.pdf`);
  };

  return (
    <div className={`p-6 space-y-10 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
       <div className="flex justify-between items-center">
          <div className="flex gap-2">
             {generatedCode && <button onClick={handleDownloadPDF} className="bg-pink-600 text-white px-6 py-4 rounded-2xl font-black italic shadow-xl flex items-center gap-2 transition-transform active:scale-95"><Download size={18}/> تحميل PDF</button>}
          </div>
          <h2 className="text-3xl font-black italic text-right">مولد الكروت الملكية</h2>
       </div>
       <div className="grid lg:grid-cols-2 gap-10">
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[3rem] border shadow-sm space-y-6`}>
             <SectionInput label="اسم العميل" value={customerName} onChange={(v:any)=>setCustomerName(v)} isDarkMode={isDarkMode} />
             <button onClick={handleGenerate} className="w-full py-6 bg-black text-white rounded-[2rem] font-black italic shadow-xl active:scale-95 transition-all">توليد الكرت الملكي</button>
          </div>
          <div className="flex flex-col items-center">
             <div ref={cardRef} className="w-[300px] h-[450px] bg-white rounded-[2.5rem] shadow-2xl relative border-[8px] border-white flex flex-col items-center p-10 text-center" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff5f7 100%)' }}>
                <div className="absolute top-0 inset-x-0 h-3 bg-pink-600 shadow-lg" />
                <div className="w-16 h-16 bg-black text-white rounded-[1.2rem] flex items-center justify-center font-black text-3xl italic mb-4 shadow-xl">ن</div>
                <h3 className="font-black text-pink-600 text-2xl mb-1 italic tracking-tighter">Nice Events</h3>
                <p className="text-[7px] font-black text-amber-600 tracking-[0.4em] uppercase mb-8">Luxury Occasion Planning</p>
                {qrDataUrl ? <img src={qrDataUrl} className="w-36 h-36 mb-6" /> : <div className="w-36 h-36 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center mb-6"><QrCode className="text-gray-100" /></div>}
                <p className="text-[9px] font-black text-pink-600 mb-1 uppercase">{customerName || 'اسم العميل'}</p>
                <h4 className="text-xl font-black italic text-gray-800 tracking-widest">{generatedCode || 'NICE-0000'}</h4>
             </div>
          </div>
       </div>
    </div>
  );
}

function AdminBookingManager({ bookings, onRefresh, isDarkMode }: any) {
  const updateStatus = async (id: string, status: string) => {
    await supabaseOperation('update', 'bookings', { status }, id);
    onRefresh();
  };
  return (
    <div className={`p-6 space-y-8 text-right pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''} animate-fade`}>
       <h2 className="text-3xl font-black italic">إدارة العمليات</h2>
       <div className="space-y-4">
          {bookings.map((b: any) => (
             <div key={b.id} className={`${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100'} p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between border-r-8 border-r-pink-600`}>
                <div className="flex gap-2">
                   {b.status === 'Pending' && <button onClick={()=>updateStatus(b.id, 'Confirmed')} className="p-3 bg-green-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><CheckCircle size={20}/></button>}
                   {b.status === 'Confirmed' && <button onClick={()=>updateStatus(b.id, 'Delivered')} className="p-3 bg-blue-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><Layers size={20}/></button>}
                   <Link to={`/booking-status/${b.id}`} className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-50 text-gray-400'} hover:bg-pink-50 hover:text-pink-600 transition-colors`}><Eye size={20}/></Link>
                </div>
                <div className="text-right">
                   <div className="flex items-center justify-end gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${b.status==='Confirmed'?'bg-green-100 text-green-600':'bg-amber-100 text-amber-600'}`}>{b.status}</span>
                      <span className="text-[10px] font-black uppercase text-pink-600">#{b.id.slice(-6)}</span>
                   </div>
                   <p className="font-black text-xs">{b.userName} - {b.totalPrice} ر.س</p>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}

function AdminCodesManager({ codes, onRefresh, isDarkMode }: any) {
  const approve = async (id: string) => {
    const code = `NICE-${Math.floor(1000 + Math.random() * 8999)}`;
    await supabaseOperation('update', 'customer_codes', { status: 'approved', isActive: true, code }, id);
    onRefresh();
  };
  return (
    <div className={`p-6 space-y-8 text-right pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''} animate-fade`}>
       <h2 className="text-3xl font-black italic">إدارة الوصول</h2>
       <div className="space-y-4">
          {codes.map((c: any) => (
             <div key={c.id} className={`${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100'} p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between`}>
                <div className="flex gap-2">
                   {c.status === 'pending' && <button onClick={()=>approve(c.id)} className="p-3 bg-green-500 text-white rounded-xl shadow-lg transition-transform active:scale-90"><UserCheck size={20}/></button>}
    await supabaseOperation('delete','customer_codes',null,c.id);
                </div>
                <div className="text-right">
                   <p className="font-black text-xs uppercase tracking-tighter">{c.customerName}</p>
                   <div className="text-pink-600 font-black italic tracking-widest">{c.code}</div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}

function AdminReportsView({ bookings, isDarkMode }: any) {
  const confirmed = bookings.filter((b: any) => b.status === 'Confirmed' || b.status === 'Completed' || b.status === 'Delivered');
  const revenue = confirmed.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
  return (
    <div className={`p-6 space-y-10 text-right animate-fade ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
       <h2 className="text-3xl font-black italic">التقارير المالية</h2>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard title="إجمالي الدخل" value={`${revenue} ر.س`} icon={<TrendingUp/>} color="bg-black" />
          <StatCard title="الحجوزات المعتمدة" value={confirmed.length} icon={<CheckCircle/>} color="bg-pink-600" />
       </div>
    </div>
  );
}

function AdminSettingsView({ content, onRefresh, isDarkMode }: any) {
  const [form, setForm] = useState(content);
  return (
    <div className={`p-6 space-y-10 text-right pb-32 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
       <h2 className="text-3xl font-black italic text-center">إعدادات النظام الملكية</h2>
       <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-10 rounded-[4rem] border shadow-xl space-y-8`}>
          <SectionInput label="عن فرحتي" value={form.aboutUs} onChange={(v:any)=>setForm({...form, aboutUs:v})} type="textarea" isDarkMode={isDarkMode} />
          <SectionInput label="سياسة التأجير" value={form.rentalPolicy} onChange={(v:any)=>setForm({...form, rentalPolicy:v})} type="textarea" isDarkMode={isDarkMode} />
          <SectionInput label="كلمة مرور الإدارة" value={form.admin_password} onChange={(v:any)=>setForm({...form, admin_password:v})} type="password" isDarkMode={isDarkMode} />
          <button onClick={async()=>{await supabaseOperation('set','app_content',form, content.id || 'main'); onRefresh(); alert('تم حفظ الإعدادات بنجاح');}} className="w-full py-6 bg-black text-white rounded-[2.5rem] font-black italic shadow-2xl active:scale-95 transition-all">
             <Save className="inline-block ml-2"/> حفظ كافة التعديلات
          </button>
       </div>
    </div>
  );
}

// --- Store Specific Components ---

function StoreHomeView({ products, categories, onAdd, isDarkMode }: any) {
  const [filter, setFilter] = useState('الكل');
  const [search, setSearch] = useState('');
  
  const filtered = products.filter((p: any) => {
    const matchesFilter = filter === 'الكل' || p.categoryId === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch && p.isAvailable;
  });

  return (
    <div className={`p-6 pb-32 text-right animate-fade ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
      <div className="relative mb-8 group">
         <input 
            className={`w-full p-5 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-[2rem] pr-14 font-bold text-xs outline-none border-2 border-transparent focus:border-pink-500 transition-all shadow-inner`} 
            placeholder="ابحث عن قطعة ملكية..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
         />
         <Search size={20} className={`absolute right-6 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} group-focus-within:text-pink-600 transition-colors`} />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 mb-8 -mx-6 px-6">
        {['الكل', ...categories.map((c:any)=>c.name)].map(f => (
          <button 
            key={f} 
            onClick={()=>setFilter(f)} 
            className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black italic whitespace-nowrap transition-all active:scale-90 ${filter===f?'bg-black text-white shadow-xl':(isDarkMode ? 'bg-gray-900 text-gray-500 hover:bg-gray-800' : 'bg-gray-50 text-gray-400 hover:bg-gray-100')}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center mb-8">
        <h2 className={`text-3xl font-black italic tracking-tighter ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>المعرض الملكي</h2>
        <div className="w-12 h-1 bg-pink-600 rounded-full mt-2 opacity-20" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {filtered.map((p: any) => (
          <div key={p.id} className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-[2.5rem] border overflow-hidden shadow-sm group active:scale-95 transition-transform`}>
             <div className={`h-44 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} overflow-hidden relative`}>
                <img src={p.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <button 
                  onClick={(e)=>{ e.preventDefault(); onAdd(p); }} 
                  className="absolute bottom-4 left-4 p-3.5 bg-black text-white rounded-2xl shadow-xl active:scale-75 transition-all"
                >
                  <Plus size={18}/>
                </button>
                <div className={`absolute top-4 right-4 px-3 py-1 ${isDarkMode ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur rounded-full font-black text-[10px] shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-white/50'} text-pink-600`}>
                  {p.price} ر.س
                </div>
             </div>
             <div className="p-5 text-right">
                <h4 className={`font-black text-[11px] ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} truncate mb-1`}>{p.name}</h4>
                <div className="flex items-center justify-end gap-1">
                   <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{p.categoryId}</span>
                </div>
             </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 opacity-20 flex flex-col items-center">
           <Search size={60} className="mb-4" />
           <p className="font-black italic">لم نجد ما تبحث عنه</p>
        </div>
      )}
    </div>
  );
}

// --- Cart View Component ---
function CartPageView({ cart, onCheckout, onRemove, isDarkMode }: any) {
  const total = cart.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);
  
  return (
    <div className={`p-6 pb-32 text-right animate-fade ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
      <div className="flex flex-col items-center mb-10">
        <div className={`p-4 ${isDarkMode ? 'bg-pink-900/20 text-pink-500' : 'bg-pink-50 text-pink-600'} rounded-3xl mb-4 shadow-inner`}><ShoppingCart size={32}/></div>
        <h2 className="text-2xl font-black italic">السلة الملكية</h2>
        <p className="text-[10px] font-bold text-gray-400 mt-2">راجع اختياراتك لليلة العمر</p>
      </div>

      <div className="space-y-4">
        {cart.map((item: any) => (
          <div key={item.product.id} className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between`}>
            <button onClick={() => onRemove(item.product.id)} className={`p-3 rounded-xl transition-all ${isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-500'}`}>
              <Trash2 size={20} />
            </button>
            
            <div className="flex items-center gap-4 text-right flex-1 justify-end">
              <div>
                <h4 className="font-black text-sm">{item.product.name}</h4>
                <p className="text-pink-600 font-black text-xs mt-1">{item.product.price} × {item.quantity} ر.س</p>
              </div>
              <img src={item.product.images[0]} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
            </div>
          </div>
        ))}

        {cart.length === 0 ? (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
            <ShoppingCart size={60} className="mb-4" />
            <p className="font-black italic">السلة فارغة حالياً</p>
            <Link to="/store" className="mt-4 px-8 py-3 bg-pink-600 text-white rounded-2xl text-[10px] font-black italic">ابدأ التسوق</Link>
          </div>
        ) : (
          <div className={`mt-10 p-8 rounded-[3rem] ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'} border shadow-inner`}>
            <div className="flex justify-between items-center mb-8">
              <span className="text-2xl font-black italic text-pink-600">{total} ر.س</span>
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">المجموع الإجمالي</span>
            </div>
            <button 
              onClick={() => onCheckout(total)}
              className="w-full py-6 bg-black text-white rounded-[2.5rem] font-black italic shadow-xl hover:bg-pink-600 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <CheckCircle size={22}/> إتمام الحجز الملكي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UserBookingsView({ bookings, userId, isDarkMode }: any) {
  const userBookings = bookings.filter((b: any) => b.userId === userId).sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className={`p-6 pb-32 text-right animate-fade ${isDarkMode ? 'bg-gray-950' : ''}`}>
       <div className="flex flex-col items-center mb-10">
          <div className={`p-4 ${isDarkMode ? 'bg-amber-900/20 text-amber-500' : 'bg-amber-50 text-amber-600'} rounded-3xl mb-4 shadow-inner`}><Calendar size={32}/></div>
          <h2 className="text-2xl font-black italic">حجوزاتي الملكية</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-2">تابع حالة طلباتك لحظة بلحظة</p>
       </div>

       <div className="space-y-4">
          {userBookings.map((b: any) => (
             <Link to={`/booking-status/${b.id}`} key={b.id} className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} block p-6 rounded-[2.5rem] border shadow-sm active:scale-[0.98] transition-all border-r-8 border-r-pink-600`}>
                <div className="flex items-center justify-between mb-4">
                   <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     b.status === 'Confirmed' ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600') : 
                     b.status === 'Pending' ? (isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600') : 
                     (isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
                   }`}>
                      {b.status === 'Pending' ? 'قيد المراجعة' : b.status === 'Confirmed' ? 'تم التأكيد' : b.status}
                   </div>
                   <h4 className="font-black text-xs italic text-pink-600 tracking-tighter">#{b.id.slice(-6)}</h4>
                </div>
                <div className="flex items-center justify-between">
                   <span className={`text-lg font-black italic ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{b.totalPrice} ر.س</span>
                   <div className="text-right">
                      <p className="text-[9px] text-gray-400 font-bold mb-1">{new Date(b.createdAt).toLocaleDateString('ار-SA')}</p>
                      <p className={`text-[10px] font-black ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{b.items.length} قطع مختارة</p>
                   </div>
                </div>
             </Link>
          ))}

          {userBookings.length === 0 && (
            <div className="text-center py-20 opacity-20 flex flex-col items-center">
               <ShoppingBag size={60} className="mb-4" />
               <p className="font-black italic">لا يوجد حجوزات سابقة</p>
               <Link to="/store" className="mt-4 px-8 py-3 bg-pink-600 text-white rounded-2xl text-[10px] font-black italic">ابدأ التسوق</Link>
            </div>
          )}
       </div>
    </div>
  );
}

function UserBottomNav({ cartCount, onLogout }: any) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t z-[300] px-6 py-4 flex justify-between items-center no-print pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
       <button onClick={onLogout} className="p-4 text-gray-300 hover:text-red-500 transition-colors"><LogOut size={22}/></button>
       
       <div className="flex items-center gap-1 bg-gray-50 p-2 rounded-[2.5rem] shadow-inner">
          <button onClick={() => navigate('/bookings')} className={`p-4 rounded-[2rem] transition-all flex items-center gap-2 ${location.pathname==='/bookings'?'bg-black text-white shadow-xl px-8':'text-gray-400'}`}>
             {location.pathname==='/bookings' && <span className="font-black italic text-[10px]">حجوزاتي</span>}
             <Calendar size={20} />
          </button>
          
          <button onClick={() => navigate('/store')} className={`p-4 rounded-[2rem] transition-all flex items-center gap-2 ${location.pathname==='/store'?'bg-black text-white shadow-xl px-8':'text-gray-400'}`}>
             {location.pathname==='/store' && <span className="font-black italic text-[10px]">المتجر</span>}
             <Home size={20} />
          </button>
       </div>

       <button onClick={() => navigate('/cart')} className={`p-4 relative transition-all ${location.pathname==='/cart'?'text-pink-600':'text-gray-300'}`}>
          <ShoppingCart size={24} />
          {cartCount > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-pink-600 text-white rounded-full text-[9px] flex items-center justify-center font-black border-2 border-white animate-bounce">{cartCount}</span>
          )}
       </button>
    </nav>
  );
}

// --- Helpers & Shared UI ---

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => { setTimeout(onFinish, 2000); }, [onFinish]);
  return (
    <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center">
      <div className="w-32 h-32 bg-black text-white rounded-[3rem] flex items-center justify-center font-black text-6xl italic animate-bounce shadow-2xl border-b-8 border-pink-600">ن</div>
      <h1 className="mt-8 text-4xl font-black text-pink-600 italic">Nice Events</h1>
    </div>
  );
}

function LoadingScreen() { return <div className="h-screen flex items-center justify-center bg-white"><div className="w-16 h-16 border-8 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>; }

function Toast({ message, type, onClose }: any) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-md animate-in slide-in-from-top">
      <div className={`px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border-4 ${type==='success'?'bg-black text-white border-white/10':'bg-red-600 text-white border-red-400'}`}>
        <CheckCircle size={24} className={type==='success'?'text-green-400':'text-white'}/>
        <span className="font-black text-xs uppercase">{message}</span>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className={`${color} p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group`}>
       <div className="absolute -left-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500">{React.cloneElement(icon as React.ReactElement<any>, { size: 100 })}</div>
       <div className="relative z-10 text-right">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{title}</p>
          <h4 className="text-3xl font-black italic">{value}</h4>
       </div>
    </div>
  );
}

function SectionInput({ label, value, onChange, type = 'text', isDarkMode }: any) {
  const baseClasses = `w-full p-6 rounded-[1.5rem] font-bold text-sm outline-none text-right shadow-inner border-2 border-transparent focus:border-pink-500 transition-all ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`;
  return (
    <div className="space-y-2">
       <p className="text-[10px] font-black text-gray-400 pr-4 uppercase tracking-widest">{label}</p>
       {type === 'textarea' ? (
         <textarea className={`${baseClasses} min-h-[120px]`} value={value} onChange={e=>onChange(e.target.value)} placeholder={`أدخل ${label}...`} />
       ) : (
         <input className={baseClasses} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={`أدخل ${label}...`} />
       )}
    </div>
  );
}

function AccessGateView({ onVerify, onScan, onRequest, isDarkMode }: any) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState<'verify' | 'request'>('verify');
  const navigate = useNavigate();
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} w-full max-w-md p-10 rounded-[4rem] shadow-2xl text-right animate-fade`}>
        <div className="flex flex-col items-center mb-12">
           <div className="w-24 h-24 bg-black text-white rounded-[2.5rem] flex items-center justify-center font-black text-5xl italic shadow-2xl border-b-8 border-pink-600 animate-bounce">ن</div>
           <h1 className="text-3xl font-black italic text-pink-600 mt-6 tracking-tighter">Nice Events</h1>
           <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-2">تنسيق المناسبات الملكية</p>
        </div>
        {mode === 'verify' ? (
          <div className="space-y-6">
            <input className={`w-full p-6 rounded-[2rem] text-center font-black text-xl shadow-inner uppercase transition-all outline-none border-2 border-transparent focus:border-pink-500 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} placeholder="كود الدخول" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
            <button onClick={() => onVerify(code)} className="w-full py-6 bg-black text-white rounded-[2.5rem] font-black italic shadow-xl hover:bg-pink-600 transition-all">دخول للمنصة</button>
            <button onClick={onScan} className={`w-full py-6 border-2 rounded-[2.5rem] font-black italic flex items-center justify-center gap-3 text-sm ${isDarkMode ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-600'} hover:bg-gray-50 transition-all`}><QrCode size={22} className="text-pink-600"/> مسح كود QR</button>
            <div className="pt-8 border-t border-gray-100 flex flex-col gap-4 text-center">
              <button onClick={() => setMode('request')} className="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:underline">طلب كود وصول جديد</button>
              <button onClick={() => navigate('/login')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">دخول الإدارة</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <SectionInput label="الاسم الكامل" value={name} onChange={(v:any)=>setName(v)} isDarkMode={isDarkMode} />
            <SectionInput label="رقم الجوال" value={phone} onChange={(v:any)=>setPhone(v)} type="tel" isDarkMode={isDarkMode} />
            <button onClick={() => onRequest(name, phone)} className="w-full py-6 bg-pink-600 text-white rounded-[2.5rem] font-black italic shadow-xl">إرسال طلب التفعيل</button>
            <button onClick={() => setMode('verify')} className="w-full text-xs font-black text-gray-400 text-center hover:text-gray-600 transition-colors">العودة لشاشة الدخول</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AccessPendingView({ isDarkMode }: any) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
       <div className={`w-32 h-32 ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'} text-amber-500 rounded-[3rem] flex items-center justify-center mb-10 animate-pulse shadow-inner`}><Clock size={64}/></div>
       <h2 className="text-3xl font-black italic mb-6">طلبك قيد المراجعة الملكية</h2>
       <p className="text-gray-400 font-bold max-w-xs text-sm leading-relaxed">شكراً لطلبك. سيقوم فريقنا بمراجعة بياناتك وتفعيل الكود الخاص بك خلال 24 ساعة كحد أقصى.</p>
       <Link to="/access" className={`mt-16 text-pink-600 font-black text-[10px] uppercase tracking-widest border-b-2 ${isDarkMode ? 'border-pink-900' : 'border-pink-100'} pb-2 hover:border-pink-500 transition-all`}>العودة لصفحة الدخول</Link>
    </div>
  );
}

function AdminLoginView({ onLogin }: any) {
  const [pwd, setPwd] = useState('');
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="w-full max-w-md bg-white p-14 rounded-[5rem] shadow-2xl text-right animate-fade">
        <h2 className="text-center font-black italic text-3xl mb-12 text-gray-800 tracking-tighter">مركز التحكم</h2>
        <input type="password" className="w-full p-8 bg-gray-50 rounded-[2.5rem] text-center font-black text-3xl mb-8 outline-none border-2 border-transparent focus:border-pink-500 transition-all shadow-inner" placeholder="••••••" value={pwd} onChange={e=>setPwd(e.target.value)} />
        <button onClick={()=>onLogin(pwd)} className="w-full py-7 bg-pink-600 text-white rounded-[3rem] font-black text-sm uppercase shadow-xl hover:bg-pink-700 transition-all">دخول المدير</button>
        <button onClick={()=>navigate('/access')} className="w-full text-center text-[10px] font-black text-gray-300 mt-8 uppercase tracking-widest hover:text-gray-500 transition-colors">واجهة المستخدم</button>
      </div>
    </div>
  );
}

function AdminDashboardView({ bookings, codes, products, isDarkMode }: any) {
  const confirmed = bookings.filter((b: any) => b.status === 'Confirmed');
  const revenue = confirmed.reduce((s: number, b: any) => s + b.totalPrice, 0);
  return (
    <div className={`p-6 space-y-10 text-right pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''} animate-fade`}>
       <div className="flex items-center justify-between">
          <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-pink-900/20 text-pink-400' : 'bg-pink-50 text-pink-600'}`}><BarChart3 size={32}/></div>
          <h2 className="text-3xl font-black italic">لوحة المؤشرات</h2>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي الدخل" value={`${revenue} ر.س`} icon={<TrendingUp/>} color="bg-black" />
          <StatCard title="الحجوزات النشطة" value={confirmed.length} icon={<Calendar/>} color="bg-pink-600" />
          <StatCard title="طلبات الانضمام" value={codes.filter((c:any)=>c.status==='pending').length} icon={<UserPlus/>} color="bg-amber-600" />
          <StatCard title="إجمالي المخزون" value={products.length} icon={<Box/>} color="bg-gray-800" />
       </div>
    </div>
  );
}

function AdminDrawer({ isOpen, onClose, onLogout, isDarkMode }: any) {
  if (!isOpen) return null;
  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'لوحة المؤشرات' },
    { to: '/admin/products', icon: Box, label: 'إدارة المخزون' },
    { to: '/admin/categories', icon: Folders, label: 'أقسام المتجر' },
    { to: '/admin/bookings', icon: Calendar, label: 'إدارة الحجوزات' },
    { to: '/admin/codes', icon: UserPlus, label: 'أكواد العملاء' },
    { to: '/admin/card-generator', icon: QrCode, label: 'مولد الكروت' },
    { to: '/admin/reports', icon: BarChart3, label: 'التقارير المالية' },
    { to: '/admin/settings', icon: Settings, label: 'إعدادات النظام' },
  ];
  return (
    <div className="fixed inset-0 z-[1000] flex animate-in fade-in">
       <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
       <div className={`w-80 h-full relative p-12 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ${isDarkMode ? 'bg-gray-900 border-l border-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-5 mb-16 pb-10 border-b border-gray-100/10">
             <div className="w-16 h-16 bg-pink-600 rounded-[1.8rem] flex items-center justify-center text-white font-black italic text-3xl shadow-xl border-b-4 border-black/20">ن</div>
             <div className="text-right">
                <span className="font-black text-pink-600 text-2xl tracking-tighter block leading-none">Nice Events</span>
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-1">Admin Panel</span>
             </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
             {links.map(l => (
                <Link key={l.to} to={l.to} onClick={onClose} className={`flex items-center justify-end gap-5 p-6 rounded-[2.5rem] font-black text-[11px] uppercase italic transition-all group ${isDarkMode ? 'hover:bg-pink-900/20 text-gray-500 hover:text-pink-400' : 'hover:bg-pink-50 text-gray-400 hover:text-pink-600'}`}>
                   <span>{l.label}</span> 
                   <l.icon size={22} className="group-hover:scale-110 transition-transform"/>
                </Link>
             ))}
          </div>
          <button onClick={onLogout} className="flex items-center justify-end gap-5 p-6 text-red-400 font-black mt-8 hover:bg-red-500/10 rounded-[2.5rem] transition-all"><span className="text-[11px] uppercase italic tracking-widest">تسجيل الخروج</span><LogOut size={22}/></button>
       </div>
    </div>
  );
}

function ProtectedRoute({ role, children, adminOnly = false }: any) { 
  if (!role) return <Navigate to="/access" replace />; 
  if (adminOnly && role !== UserRole.ADMIN) return <Navigate to="/store" replace />;
  return <>{children}</>; 
}

// --- Booking Status View ---

function BookingStatusView({ bookings, products, isDarkMode }: any) {
  const { id } = useParams();
  const booking = bookings.find((b: any) => b.id === id);
  if (!booking) return <div className={`p-20 text-center font-black ${isDarkMode ? 'text-white' : ''}`}>الحجز غير موجود</div>;

  return (
    <div className={`p-6 pb-32 text-right animate-fade ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
       <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-pink-600 text-white rounded-3xl flex items-center justify-center mb-4 shadow-xl"><CheckCircle size={40}/></div>
          <h2 className="text-2xl font-black italic">تفاصيل الحجز الملكي</h2>
          <p className="text-xs font-bold text-gray-400 mt-2">#{booking.id}</p>
       </div>

       <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[3rem] border shadow-sm space-y-6`}>
          <div className="flex justify-between border-b pb-4 border-gray-100/10">
             <span className="font-black text-pink-600">{booking.status}</span>
             <span className="text-gray-400 text-xs">حالة الحجز</span>
          </div>
          <div className="flex justify-between border-b pb-4 border-gray-100/10">
             <span className="font-black">{booking.userName}</span>
             <span className="text-gray-400 text-xs">العميل</span>
          </div>
          <div className="space-y-4 pt-4">
             <p className="text-gray-400 text-xs">القطع المختارة:</p>
             {booking.items.map((item: any, idx: number) => (
                <div key={idx} className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} p-4 rounded-2xl flex justify-between items-center`}>
                   <span className="font-black text-xs">{item.quantity} × {item.name}</span>
                </div>
             ))}
          </div>
          <div className="pt-6 flex justify-between items-center">
             <span className="text-2xl font-black italic text-pink-600">{booking.totalPrice} ر.س</span>
             <span className="text-gray-400 text-xs font-black uppercase">الإجمالي</span>
          </div>
       </div>
    </div>
  );
}

// --- Support Chat Modal ---

function SupportChatModal({ isOpen, onClose, messages, onSend, user, role, isDarkMode }: any) {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  // Filter messages based on role
  const filteredMessages = messages.filter((m: any) => {
    if (role === UserRole.ADMIN) {
      return true; // Admin sees all messages
    } else {
      return m.customer_code_id === user?.id; // Customer sees only their messages
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
       <div className={`w-full max-w-lg h-[80vh] relative rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
          <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
             <button onClick={onClose} className="p-2 hover:bg-gray-100/10 rounded-full transition-colors"><X size={24}/></button>
             <h3 className="font-black italic text-pink-600">الدعم الملكي المباشر</h3>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
             {filteredMessages.map((m: any) => (
                <div key={m.id} className={`flex ${m.sender_type === (role === UserRole.ADMIN ? 'admin' : 'customer') ? 'justify-start' : 'justify-end'}`}>
                   <div className={`max-w-[80%] p-4 rounded-[1.5rem] font-bold text-[11px] shadow-sm ${m.sender_type === 'admin' ? 'bg-pink-600 text-white' : (isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800')}`}>
                      {m.message}
                   </div>
                </div>
             ))}
          </div>
          <div className={`p-6 border-t flex gap-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
             <button onClick={() => { if(text.trim()){onSend(text); setText('');} }} className="p-4 bg-black text-white rounded-2xl active:scale-90 transition-transform"><Send size={20}/></button>
             <input
                className={`flex-1 p-4 rounded-2xl text-right outline-none font-bold text-xs ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} border-2 border-transparent focus:border-pink-500 transition-all`}
                placeholder="اكتب رسالتك هنا..."
                value={text}
                onChange={e=>setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && text.trim() && (onSend(text), setText(''))}
             />
          </div>
       </div>
    </div>
  );
}

// --- Barcode Scanner Modal ---

function BarcodeScannerModal({ isOpen, onClose, onScan }: any) {
  const [input, setInput] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in">
       <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
       <div className="bg-white w-full max-w-sm p-10 rounded-[4rem] relative text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-pink-50 text-pink-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><QrCode size={40}/></div>
          <h3 className="font-black text-xl mb-4 italic text-gray-800">ماسح الكود الملكي</h3>
          <p className="text-gray-400 text-[10px] font-bold mb-8 uppercase tracking-widest leading-relaxed">قم بإدخال الكود يدوياً أو استخدم الكاميرا (قريباً في التحديث القادم)</p>
          <input 
            autoFocus 
            className="w-full p-6 bg-gray-50 rounded-[2rem] text-center font-black text-2xl mb-8 border-2 border-transparent focus:border-pink-500 outline-none uppercase shadow-inner text-gray-900" 
            placeholder="NICE-0000"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
          />
          <div className="flex gap-4">
             <button onClick={onClose} className="flex-1 py-5 bg-gray-100 rounded-[2rem] font-black text-[10px] text-gray-400 uppercase tracking-widest active:scale-95 transition-all">إلغاء</button>
             <button 
                onClick={() => { if(input.trim()){onScan(input); onClose(); setInput('');} }} 
                className="flex-[2] py-5 bg-black text-white rounded-[2rem] font-black text-[10px] italic uppercase tracking-widest shadow-xl active:scale-95 transition-all"
             >
                تأكيد الكود
             </button>
          </div>
       </div>
    </div>
  );
}
