import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Link, useLocation, useParams, Navigate } from 'react-router-dom';
import { toDataURL } from 'qrcode';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import jsQR from 'jsqr';
import {
  Home, ShoppingCart, User, LogOut, LayoutDashboard, Box,
  Calendar, Settings, Plus, Trash2, CheckCircle, QrCode,
  MessageCircle, X, Camera, Clock, Edit2, UserCheck,
  Menu, Send, TrendingUp, Layers, Sun, Moon, BarChart3,
  Save, Eye, UserPlus, Key, MapPin, ArrowRight, Star, Printer, ChevronLeft,
  MessageSquare, Folders, Search, Info, Download, Copy, Share2, Filter, ShoppingBag,
  Image as ImageIcon, ToggleLeft, ToggleRight, AlertCircle, Phone, DollarSign, CalendarCheck, Bell
} from 'lucide-react';

// (تم نقل جميع الاستيرادات للأعلى)
// --- User Settings View (إعدادات المستخدم) ---

import { Product, Category, Section, Booking, UserRole, AppContent, CustomerCode, ChatMessage } from './types';
import { INITIAL_CONTENT } from './constants';
import { dbOperation, onSnapshot, collection, db, uploadFile } from './lib/firebase';
import { NotificationService } from './lib/notificationService';

// --- وظائف المساعدة العامة ---
const saveToLocal = (key: string, data: any) => localStorage.setItem(`nice_v5_${key}`, JSON.stringify(data));
const getFromLocal = (key: string, fallback: any) => {
  const saved = localStorage.getItem(`nice_v5_${key}`);
  try { return saved ? JSON.parse(saved) : fallback; } catch { return fallback; }
};
const formatCurrency = (amount: number, currency: string = 'SAR') => {
  const symbols = {
    SAR: 'ر.س',
    YER: 'ر.ي',
    USD: '$'
  };
  const locales = {
    SAR: 'ar-SA',
    YER: 'ar-YE',
    USD: 'en-US'
  };
  return `${Math.floor(amount).toLocaleString(locales[currency as keyof typeof locales])} ${symbols[currency as keyof typeof symbols]}`;
};
const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

// Currency conversion function
const getConvertedPrice = (price: number, fromCurrency: string = 'SAR', toCurrency: string = 'SAR', exchangeRates: any = {}) => {
  if (fromCurrency === toCurrency) return price;

  // Convert to SAR first if needed
  let priceInSAR = price;
  if (fromCurrency === 'YER') priceInSAR = price / (exchangeRates.sar_to_yer || 140);
  if (fromCurrency === 'USD') priceInSAR = price / (exchangeRates.sar_to_usd || 0.27);

  // Convert from SAR to target currency
  if (toCurrency === 'YER') return priceInSAR * (exchangeRates.sar_to_yer || 140);
  if (toCurrency === 'USD') return priceInSAR * (exchangeRates.sar_to_usd || 0.27);

  return priceInSAR;
};

// --- User Settings View (إعدادات المستخدم) --- 

function UserSettingsView({ user, isDarkMode, onLogout, selectedCurrency, selectedCountry, onCurrencyChange, onCountryChange }: any) {
  const [language, setLanguage] = useState('ar');

  return (
    <div className={`p-6 space-y-8 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
      <h2 className="text-3xl font-black italic">إعدادات المستخدم</h2>

      {/* Country and Currency Selection */}
      <div className={`p-8 rounded-[3rem] border shadow-xl space-y-8 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <h3 className="text-xl font-black italic text-pink-600">اختر الدولة والعملة</h3>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 pr-4 uppercase">اختر الدولة والعملة</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onCountryChange('SA')}
              className={`p-4 rounded-2xl font-bold text-sm transition-all ${selectedCountry === 'SA' ? 'bg-green-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              السعودية 🇸🇦<br/>ريال سعودي
            </button>
            <button
              onClick={() => onCountryChange('YE')}
              className={`p-4 rounded-2xl font-bold text-sm transition-all ${selectedCountry === 'YE' ? 'bg-red-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              اليمن 🇾🇪<br/>ريال يمني
            </button>
            <button
              onClick={() => onCountryChange('US')}
              className={`p-4 rounded-2xl font-bold text-sm transition-all ${selectedCountry === 'US' ? 'bg-blue-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              أمريكا 🇺🇸<br/>دولار أمريكي
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 pr-4 uppercase">العملة المختارة حالياً</p>
          <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-2xl">
            <span className="text-lg font-black text-pink-600">
              {selectedCountry === 'SA' ? 'ريال سعودي (SAR)' : selectedCountry === 'YE' ? 'ريال يمني (YER)' : 'دولار أمريكي (USD)'}
            </span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className={`p-8 rounded-[3rem] border shadow-xl ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <h3 className="text-xl font-black italic text-pink-600 mb-4">معلومات المستخدم</h3>
        <p className="text-lg font-bold">مرحباً {user?.customer_name || 'مستخدم'}!</p>
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>الكود: {user?.code}</p>
      </div>

      {/* Logout Button */}
      <div className="flex justify-center">
        <button onClick={onLogout} className="w-full py-6 bg-red-500 text-white rounded-[2rem] font-black italic shadow-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2">
          <LogOut size={20} /> تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

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
  const [selectedCurrency, setSelectedCurrency] = useState<'SAR' | 'YER' | 'USD'>('SAR');
  const [selectedCountry, setSelectedCountry] = useState<'SA' | 'YE' | 'US'>('SA');
  const [exchangeRates, setExchangeRates] = useState<any>({ sar_to_yer: 140, sar_to_usd: 0.27 });
  const [userPreferredCurrency, setUserPreferredCurrency] = useState<'SAR' | 'YER' | 'USD'>('SAR');

  // Real-time listeners for app_settings, bookings, and customer_codes are set up in setupSync

  // Save user settings to Firebase
  const saveUserSettings = async (currency: string, country: string) => {
    if (!userSession?.id) return;
    try {
      await dbOperation('set', 'user_settings', {
        user_id: userSession.id,
        selectedCurrency: currency,
        selectedCountry: country,
        updated_at: new Date().toISOString()
      }, userSession.id);
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  };

  const handleCurrencyChange = (currency: 'SAR' | 'YER' | 'USD') => {
    setSelectedCurrency(currency);
    saveUserSettings(currency, selectedCountry);
  };

  const handleCountryChange = (country: 'SA' | 'YE' | 'US') => {
    setSelectedCountry(country);
    saveUserSettings(selectedCurrency, country);
  };
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setMsg({ message, type });

  // دالة إعادة جلب البيانات
  const refreshData = async () => {
    try {
      const [catsRes, prodsRes, codesRes, bksRes, msgsRes, appSettingsRes] = await Promise.all([
        dbOperation('get', 'categories'),
        dbOperation('get', 'products'),
        dbOperation('get', 'customer_codes'),
        dbOperation('get', 'bookings'),
        dbOperation('get', 'chat_messages'),
        dbOperation('get', 'app_settings'),
      ]);

      if (catsRes) setCategories(catsRes || []);
      if (prodsRes) setProducts(prodsRes || []);
      if (codesRes) setCustomerCodes(codesRes || []);
      if (bksRes) setBookings(bksRes || []);
      if (msgsRes) setChatMessages(msgsRes || []);

      let contentData = INITIAL_CONTENT;
      if (appSettingsRes && appSettingsRes.length > 0) {
        contentData = appSettingsRes[0];
      }
      setContent(contentData);
    } catch (error) {
      console.error('خطأ في إعادة جلب البيانات:', error);
    }
  };

  // إعداد التزامن اللحظي مع Firebase
  useEffect(() => {
    const setupSync = async () => {
      try {
        // 1. جلب البيانات الأولية
        const [catsRes, prodsRes, msgsRes] = await Promise.all([
          dbOperation('get', 'categories'),
          dbOperation('get', 'products'),
          dbOperation('get', 'chat_messages'),
        ]);

        if (catsRes) setCategories(catsRes || []);
        else setCategories([]);
        if (prodsRes) setProducts(prodsRes || []);
        else setProducts([]);
        if (msgsRes) setChatMessages(msgsRes || []);
        else setChatMessages([]);

        setIsLoading(false);

        // 2. إعداد Firebase onSnapshot listeners للمنتجات والفئات والرسائل
        const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
          setProducts(productsData);
        });

        const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
          const categoriesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
          setCategories(categoriesData);
        });

        const unsubscribeMessages = onSnapshot(collection(db, 'chat_messages'), (snapshot) => {
          const messagesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatMessage));
          setChatMessages(messagesData);
        });

        // 3. إعداد Firebase onSnapshot listeners لـ bookings, customer_codes, و app_settings
        const unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
          const bookingsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Booking));
          setBookings(bookingsData);

          // Sound notification for new bookings
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              // Play notification sound for new booking
              const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
              audio.volume = 0.5;
              audio.play().catch(e => console.log('Audio play failed:', e));
            }
          });
        });

        const unsubscribeCustomerCodes = onSnapshot(collection(db, 'customer_codes'), (snapshot) => {
          const codesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CustomerCode));
          setCustomerCodes(codesData);
          if (userSession) {
            const current = codesData.find(c => c.id === userSession.id);
            if (current) setUserSession(current);
          }
        });

        const unsubscribeAppSettings = onSnapshot(collection(db, 'app_settings'), (snapshot) => {
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.exchange_rates) {
              setExchangeRates(data.exchange_rates);
            }
            // Update content for admin settings
            setContent(prevContent => ({
              ...prevContent,
              admin_password: data.admin_password || prevContent.admin_password,
              main_welcome_message: data.main_welcome_message || prevContent.main_welcome_message,
              whatsapp_link: data.whatsapp_link || prevContent.whatsapp_link,
            }));
          });
        });

        // جلب عدد الإشعارات غير المقروءة للمستخدم
        if (userSession?.id) {
          try {
            const stats = await NotificationService.getNotificationStats(userSession.id);
            setUnreadNotificationsCount(stats.unread);
          } catch (error) {
            console.log('Failed to fetch notification stats:', error);
          }
        }

        return () => {
          unsubscribeProducts();
          unsubscribeCategories();
          unsubscribeMessages();
          unsubscribeBookings();
          unsubscribeCustomerCodes();
          unsubscribeAppSettings();
        };
      } catch (error) {
        console.error('خطأ في إعداد التزامن:', error);
        // في حالة الخطأ، استخدم البيانات الافتراضية
        setCategories([]);
        setProducts([]);
        setCustomerCodes([]);
        setBookings([]);
        setChatMessages([]);
        setContent(INITIAL_CONTENT);
        setIsLoading(false);
        showToast('فشل في الاتصال بقاعدة البيانات. تحقق من الإعدادات.', 'error');
      }
    };

    setupSync();
  }, [userSession?.id]);

  useEffect(() => {
    saveToLocal('userRole', role);
    saveToLocal('userSession', userSession);
    saveToLocal('cart', cart);
    saveToLocal('darkMode', isDarkMode);
    saveToLocal('selectedCurrency', selectedCurrency);
    saveToLocal('selectedCountry', selectedCountry);
  }, [role, userSession, cart, isDarkMode, selectedCurrency, selectedCountry]);

  const handleVerify = async (code: string) => {
    if (code === (content.admin_password || 'ADMIN123')) {
      setRole(UserRole.ADMIN); navigate('/admin');
      showToast('مرحباً بك في مركز التحكم الإداري'); return;
    }

    // البحث في قاعدة البيانات أولاً
    const found = customerCodes.find(c => c.code === code && c.is_active);
    if (found) {
      setRole(UserRole.USER); setUserSession(found);
      navigate('/store'); showToast(`أهلاً بك ${found.customer_name}`); return;
    }

    // البحث في التخزين المحلي إذا لم يوجد في قاعدة البيانات
    const localCodes = JSON.parse(localStorage.getItem('local_customer_codes') || '[]');
    const localFound = localCodes.find((c: any) => c.code === code && c.is_active);
    if (localFound) {
      setRole(UserRole.USER); setUserSession(localFound);
      navigate('/store'); showToast(`أهلاً بك ${localFound.customer_name} (كود محلي)`); return;
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
      user_id: userSession.id,
      user_name: userSession.customer_name,
      user_phone: userSession.user_phone || '',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      status: 'Pending',
      total_price: total,
      location: 'سيتم التحديد عند التواصل',
      created_at: new Date().toISOString(),
      items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity, name: i.product.name })),
      deposit_amount: total * 0.2,
      event_date: '',
      event_time: ''
    };
    const res = await dbOperation('set', 'bookings', newBooking, id);
    if (!res) {
      showToast('فشل في إرسال طلب الحجز', 'error');
      return;
    }
    setCart([]);
    navigate(`/booking-status/${id}`);
    showToast('تم إرسال طلب الحجز بنجاح');
  };

  useEffect(() => {
    // تحقق إذا تم تفعيل كود المستخدم أثناء الانتظار
    if (role === UserRole.USER && userSession && userSession.status === 'approved') {
      showToast('تمت الموافقة على طلبك! يمكنك الآن الدخول واستخدام الكود.');
      // يمكن هنا عرض نافذة الباركود أو إعادة توجيه المستخدم تلقائياً
      // navigate('/store');
    }
  }, [role, userSession]);

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
            <div className="w-12 h-12 bg-pink-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-sm shadow-xl border-2 border-white">{userSession?.customer_name?.charAt(0) || 'U'}</div>
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
              <Link to="/notifications" className="p-3 bg-amber-50 text-amber-600 rounded-2xl relative active:scale-90 transition-transform">
                <Bell size={20} />
                {unreadNotificationsCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-black text-white">{unreadNotificationsCount}</span>}
              </Link>
            )}
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
            await dbOperation('set', 'customer_codes', { id, customer_name: n, user_phone: p, status: 'pending', is_active: false, wallet_balance: 0, code: 'PENDING', created_at: new Date().toISOString() }, id);
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
          
          <Route path="/admin/*" element={<ProtectedRoute role={role} adminOnly><AdminRoutes products={products} categories={categories} bookings={bookings} codes={customerCodes} content={content} onRefresh={refreshData} isDarkMode={isDarkMode} setProducts={setProducts} setCategories={setCategories} /></ProtectedRoute>} />
          
          <Route path="/cart" element={<ProtectedRoute role={role}><CartPageView cart={cart} onCheckout={handleCheckout} onRemove={(id) => setCart(prev => prev.filter(i => i.product.id !== id))} isDarkMode={isDarkMode} selectedCurrency={selectedCurrency} exchangeRates={exchangeRates} /></ProtectedRoute>} />
          <Route path="/booking-status/:id" element={<ProtectedRoute role={role}><BookingStatusView bookings={bookings} products={products} isDarkMode={isDarkMode} /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role={role}><UserProfileView user={userSession} bookings={bookings} isDarkMode={isDarkMode} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute role={role}><UserSettingsView user={userSession} isDarkMode={isDarkMode} onLogout={handleLogout} selectedCurrency={selectedCurrency} selectedCountry={selectedCountry} onCurrencyChange={setSelectedCurrency} onCountryChange={setSelectedCountry} /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute role={role}><NotificationsView userId={userSession?.id} isDarkMode={isDarkMode} /></ProtectedRoute>} />

          <Route path="/pages" element={<ProtectedRoute role={role}><PagesView role={role} isDarkMode={isDarkMode} /></ProtectedRoute>} />

        </Routes>
      </main>

      {showUserNav && <UserBottomNav cartCount={cart.length} onLogout={handleLogout} />}

      {role && <AdminDrawer isOpen={isAdminDrawerOpen} onClose={() => setIsAdminDrawerOpen(false)} onLogout={handleLogout} isDarkMode={isDarkMode} />}
      
      <SupportChatModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} messages={chatMessages} onSend={async t => {
        const id = `MSG-${Date.now()}`;
        await dbOperation('set', 'chat_messages', {
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

// ----------------------------------------------------------------------
// --- Components & Views (الإضافات الكاملة) ---
// ----------------------------------------------------------------------


// --- 1. Admin Product Manager ---

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

// --- 2. Admin Category Manager ---

function AdminCategoryManager({ categories, onRefresh, isDarkMode, setCategories }: any) {
  const [newCat, setNewCat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');

  const handleAdd = async () => {
    if (!newCat.trim()) return;
    const id = `cat-${Date.now()}`;
    const categoryData = { id, name: newCat, sections: [] };
    await dbOperation('set', 'categories', categoryData, id);
    alert('Saved Successfully!');
    // Immediate UI update
    setCategories(prev => [...prev, categoryData]);
    setNewCat('');
    onRefresh();
  };

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditedName(name);
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim()) return;
    await dbOperation('update', 'categories', { name: editedName }, editingId);
    alert('Saved Successfully!');
    // Immediate UI update
    setCategories(prev => prev.map(c => c.id === editingId ? { ...c, name: editedName } : c));
    setEditingId(null);
    setEditedName('');
    onRefresh();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedName('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      await dbOperation('delete', 'categories', null, id);
      // Immediate UI update
      setCategories(prev => prev.filter(c => c.id !== id));
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
               {editingId === c.id ? (
                 <div className="flex gap-2 flex-1">
                   <input
                     className={`flex-1 p-3 rounded-xl text-right outline-none border-2 border-transparent focus:border-pink-500 transition-all shadow-inner font-bold text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-transparent text-gray-900'}`}
                     value={editedName}
                     onChange={e => setEditedName(e.target.value)}
                   />
                   <button onClick={handleSaveEdit} className="text-green-500 p-3 hover:bg-green-50 rounded-xl transition-colors"><CheckCircle size={20} /></button>
                   <button onClick={handleCancelEdit} className="text-red-500 p-3 hover:bg-red-50 rounded-xl transition-colors"><X size={20} /></button>
                 </div>
               ) : (
                 <>
                   <div className="flex gap-3">
                     <button onClick={() => handleEdit(c.id, c.name)} className="text-blue-500 p-3 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={20} /></button>
                     <button onClick={() => handleDelete(c.id)} className="text-red-500 p-3 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
                   </div>
                   <div className="text-right">
                      <span className="font-black italic text-lg">{c.name}</span>
                   </div>
                 </>
               )}
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

// --- 3. Admin Routes & Components ---

function AdminRoutes({ products, categories, bookings, codes, content, onRefresh, isDarkMode, setProducts, setCategories }: any) {
  return (
    <Routes>
      <Route index element={<AdminDashboardView bookings={bookings} codes={codes} products={products} isDarkMode={isDarkMode} />} />
      <Route path="products" element={<AdminProductManager products={products} categories={categories} onRefresh={onRefresh} isDarkMode={isDarkMode} setProducts={setProducts} />} />
      <Route path="categories" element={<AdminCategoryManager categories={categories} onRefresh={onRefresh} isDarkMode={isDarkMode} setCategories={setCategories} />} />
      <Route path="bookings" element={<AdminBookingManager bookings={bookings} onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
      <Route path="codes" element={<AdminCodesManager codes={codes} onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
      <Route path="card-generator" element={<AdminCardGenerator onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
      <Route path="reports" element={<AdminReportsView bookings={bookings} isDarkMode={isDarkMode} />} />
      <Route path="settings" element={<AdminSettingsView content={content} onRefresh={onRefresh} isDarkMode={isDarkMode} />} />
    </Routes>
  );
}

// --- 4. Admin Card Generator ---

function AdminCardGenerator({ onRefresh, isDarkMode }: any) {
  const [customerName, setCustomerName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const generateComplexCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = async () => {
    if (!customerName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }
    const newCode = generateComplexCode();
    try {
      const qr = await toDataURL(newCode, { margin: 1, width: 400 });
      setGeneratedCode(newCode);
      setQrDataUrl(qr);

      // استخدام Firebase لإنشاء الكود
      await dbOperation('set', 'customer_codes', {
        id: `CODE-${Date.now()}`,
        code: newCode,
        customer_name: customerName,
        user_phone: userPhone,
        is_active: true,
        status: 'approved',
        wallet_balance: 0,
        created_at: new Date().toISOString()
      }, `CODE-${Date.now()}`);

      onRefresh();
      alert('تم توليد الكود وحفظه بنجاح');
    } catch (error: any) {
      console.error('خطأ في توليد الكود:', error);
      alert(`حدث خطأ في توليد الكود: ${error.message}`);
      setGeneratedCode('');
      setQrDataUrl('');
    }
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
             <SectionInput label="رقم الهاتف (اختياري)" value={userPhone} onChange={(v:any)=>setUserPhone(v)} isDarkMode={isDarkMode} type="tel" />
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
                <p className="text-[8px] font-bold text-gray-400 mt-2">{userPhone || '05XXXXXXXX'}</p>
             </div>
          </div>
        </div>
    </div>
  );
}

// --- 5. Admin Booking Manager (مكتملة) ---

function AdminBookingManager({ bookings, onRefresh, isDarkMode }: any) {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Function to generate WhatsApp invoice message
  const generateInvoiceMessage = (booking: any) => {
    const customerName = booking.user_name || 'غير محدد';
    const eventDate = booking.event_date ? new Date(booking.event_date).toLocaleDateString('ar-SA') : 'لم يحدد';
    const totalPrice = formatCurrency(booking.total_price || 0);
    const currency = 'ر.س'; // Assuming SAR as default

    const message = `تفاصيل الحجز الجديد:

العميل: ${customerName}
التاريخ: ${eventDate}
الإجمالي: ${totalPrice} ${currency}

رقم الحجز: ${booking.id}
تاريخ الطلب: ${formatDate(booking.createdAt)}

فرحتي لتنسيق المناسبات`;

    return encodeURIComponent(message);
  };

  // Function to send invoice to WhatsApp
  const sendInvoiceToWhatsApp = (booking: any) => {
    const message = generateInvoiceMessage(booking);
    const phoneNumber = booking.user_phone ? booking.user_phone.replace(/^\+/, '') : '967735263137'; // Use booking phone or fallback
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredBookings = bookings.filter((b: any) => {
    if (!b) return false;
    const statusMatch = filter === 'All' || b.status === filter;
    const searchMatch = (b.user_name && typeof b.user_name === 'string' && b.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (b.id && typeof b.id === 'string' && b.id.toLowerCase().includes(searchTerm.toLowerCase()));
    return statusMatch && searchMatch;
  });

  const updateStatus = async (id: string, status: string) => {
    await dbOperation('update', 'bookings', { status }, id);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      await dbOperation('delete', 'bookings', null, id);
      onRefresh();
    }
  };

  return (
    <div className={`p-6 space-y-8 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
      <h2 className="text-3xl font-black italic">إدارة الحجوزات</h2>
      
      <div className={`p-5 rounded-[2rem] shadow-lg flex justify-between items-center ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
        
        <div className="flex gap-4">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                filter === s ? 'bg-pink-600 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'All' ? 'الكل' : s === 'Pending' ? 'بانتظار التأكيد' : s === 'Confirmed' ? 'مؤكد' : s === 'Completed' ? 'مكتمل' : 'ملغى'}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search size={20} className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الحجز..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full p-4 pl-12 rounded-[1.5rem] font-bold text-sm outline-none text-right shadow-inner ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-transparent text-gray-900'}`}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((b: any) => (
            <div key={b.id} className={`p-6 rounded-[2.5rem] border shadow-md transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div className="flex gap-3">
                  <button onClick={() => handleDelete(b.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-black italic text-pink-600">{b.user_name}</h3>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{b.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b py-4 mb-4">
                <div className="flex items-center gap-2 text-right justify-end"><Clock size={16} /> <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{formatDate(b.createdAt)}</span></div>
                <div className="flex items-center gap-2 text-right justify-end"><Phone size={16} /> <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{b.user_phone || 'لا يوجد'}</span></div>
                <div className="flex items-center gap-2 text-right justify-end"><DollarSign size={16} /> <span className="font-black text-pink-600">{formatCurrency(b.total_price)}</span></div>
              </div>

              <div className="space-y-2 mb-4 text-right">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>القطع المحجوزة:</p>
                <ul className="list-disc list-inside space-y-1 pr-4">
                  {b.items.map((item: any, index: number) => (
                    <li key={index} className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.name} (الكمية: {item.quantity})</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex gap-3">
                  {b.status === 'Pending' && (
                    <button onClick={() => updateStatus(b.id, 'Confirmed')} className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-green-600 flex items-center gap-2"><CheckCircle size={16} /> تأكيد</button>
                  )}
                  {b.status !== 'Cancelled' && (
                    <button onClick={() => updateStatus(b.id, 'Cancelled')} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-red-500 hover:text-white flex items-center gap-2"><X size={16} /> إلغاء</button>
                  )}
                  {b.status === 'Confirmed' && (
                    <button onClick={() => updateStatus(b.id, 'Completed')} className="bg-pink-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-pink-700 flex items-center gap-2"><CalendarCheck size={16} /> إتمام</button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
            <Calendar size={60} className="mb-4" />
            <p className="font-black italic">لا يوجد حجوزات تتطابق مع البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 6. Admin Codes Manager (مكتملة) ---

function AdminCodesManager({ codes, onRefresh, isDarkMode }: any) {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // دمج الأكواد من قاعدة البيانات والتخزين المحلي
  const localCodes = JSON.parse(localStorage.getItem('local_customer_codes') || '[]');
  const allCodes = [
    ...(codes || []).map((c: any) => ({
      ...c,
      customerName: c?.customer_name || 'غير محدد',
      userPhone: c?.user_phone || '',
      isActive: c?.is_active || false,
      walletBalance: c?.wallet_balance || 0,
      createdAt: c?.created_at || new Date().toISOString(),
      isLocal: false
    })),
    ...localCodes.map((c: any) => ({
      ...c,
      customerName: c?.customer_name || 'غير محدد',
      userPhone: c?.user_phone || c?.phone || '',
      isActive: c?.is_active || false,
      walletBalance: c?.wallet_balance || 0,
      createdAt: c?.created_at || new Date().toISOString(),
      isLocal: true
    }))
  ];

  const filteredCodes = allCodes.filter((c: any) => {
    const statusMatch = filter === 'All' || c.status === filter;
    const searchMatch = (c.customerName && typeof c.customerName === 'string' && c.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (c.code && typeof c.code === 'string' && c.code.toLowerCase().includes(searchTerm.toLowerCase()));
    return statusMatch && searchMatch;
  });

  const generateNewCode = (currentCode: string) => {
    const generateComplexCode = (length = 8) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    if (currentCode && typeof currentCode === 'string' && currentCode.startsWith('PENDING')) {
      return generateComplexCode();
    }
    return currentCode || generateComplexCode();
  };

  const updateStatus = async (id: string, status: string, code: string, isLocal?: boolean, customerName?: string, userPhone?: string) => {
    try {
      if (isLocal) {
        // تحديث الكود المحلي
        const localCodes = JSON.parse(localStorage.getItem('local_customer_codes') || '[]');
        const updatedCodes = localCodes.map((c: any) => {
          if (c.id === id) {
            return {
              ...c,
              status,
              is_active: status === 'approved',
              code: status === 'approved' ? code : 'PENDING'
            };
          }
          return c;
        });
        localStorage.setItem('local_customer_codes', JSON.stringify(updatedCodes));
      } else {
        // تحديث في قاعدة البيانات
        const isActive = status === 'approved';
        const result = await dbOperation('update', 'customer_codes', { status, is_active: isActive, code: isActive ? code : 'PENDING' }, id);
        if (status === 'approved') {
          // إرسال إشعار عبر WhatsApp للمستخدم عند التفعيل
          try {
            const message = `مرحبا ${customerName}!\n\nتم تفعيل كودك بنجاح!\n\nكود الدخول: ${code}\n\nيمكنك الآن الدخول إلى تطبيق Nice Events واستخدام الكود للتسوق والحجز.\n\nفرحتي لتنسيق المناسبات`;
            // إزالة رمز + من رقم الهاتف لـ WhatsApp
            const cleanPhone = userPhone.replace(/^\+/, '');
            // استخدام WhatsApp API بدلاً من wa.me لتحسين التفاعل بين الأجهزة المختلفة
            window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`, '_blank');
          } catch (e) { console.log('WhatsApp error:', e); }

          // إرسال إشعار داخل التطبيق أيضاً
          try {
            await NotificationService.notifyCodeApproval(id, code);
          } catch (e) { console.log('Notification error:', e); }
        }
      }
      onRefresh();
    } catch (error: any) {
      console.error('Error in updateStatus:', error);
      alert('فشل في تحديث الحالة: ' + error.message);
    }
  };

  const handleDelete = async (id: string, isLocal?: boolean) => {
    if (confirm('هل أنت متأكد من حذف هذا الكود؟ سيؤدي ذلك إلى منع العميل من الدخول.')) {
      if (isLocal) {
        // حذف من التخزين المحلي
        const localCodes = JSON.parse(localStorage.getItem('local_customer_codes') || '[]');
        const filteredCodes = localCodes.filter((c: any) => c.id !== id);
        localStorage.setItem('local_customer_codes', JSON.stringify(filteredCodes));
      } else {
        // حذف من قاعدة البيانات
        await dbOperation('delete', 'customer_codes', null, id);
      }
      onRefresh();
    }
  };

  return (
    <div className={`p-6 space-y-8 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
      <h2 className="text-3xl font-black italic">إدارة الأكواد الملكية</h2>
      
      <div className={`p-5 rounded-[2rem] shadow-lg flex justify-between items-center ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
        
        <div className="flex gap-4">
          {['All', 'approved', 'pending', 'blocked'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                filter === s ? 'bg-pink-600 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'All' ? 'الكل' : s === 'approved' ? 'مفعل' : s === 'pending' ? 'بانتظار الموافقة' : 'محظور'}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search size={20} className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الكود..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full p-4 pl-12 rounded-[1.5rem] font-bold text-sm outline-none text-right shadow-inner ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-transparent text-gray-900'}`}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredCodes.length > 0 ? (
          filteredCodes.map((c: any) => (
            <div key={c.id} className={`p-6 rounded-[2.5rem] border shadow-md transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div className="flex gap-3">
                  <button onClick={() => handleDelete(c.id, c.isLocal)} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <h3 className="text-xl font-black italic text-pink-600">{c.customerName}</h3>
                    {c.isLocal && <span className="px-2 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">محلي</span>}
                  </div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{c.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b py-4 mb-4">
                <div className="flex items-center gap-2 text-right justify-end"><Clock size={16} /> <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{formatDate(c.createdAt)}</span></div>
                <div className="flex items-center gap-2 text-right justify-end"><Phone size={16} /> <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{c.userPhone || 'لا يوجد'}</span></div>
                <div className="flex items-center gap-2 text-right justify-end"><DollarSign size={16} /> <span className="font-black text-amber-600">{formatCurrency(c.walletBalance)}</span></div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  <StatusBadge status={c.status} type="code" />
                </div>
                <div className="flex gap-3">
                  {c.status === 'pending' && (
                    <button onClick={() => updateStatus(c.id, 'approved', generateNewCode(c.code), c.isLocal, c.customerName, c.userPhone)} className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-green-600 flex items-center gap-2"><CheckCircle size={16} /> تفعيل</button>
                  )}
                  {c.status === 'approved' && (
                    <button onClick={() => updateStatus(c.id, 'blocked', 'BLOCKED', c.isLocal, c.customerName, c.userPhone)} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-red-500 hover:text-white flex items-center gap-2"><X size={16} /> حظر</button>
                  )}
                  {c.status === 'blocked' && (
                    <button onClick={() => updateStatus(c.id, 'approved', generateNewCode(c.code), c.isLocal, c.customerName, c.userPhone)} className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-blue-600 flex items-center gap-2"><UserCheck size={16} /> إعادة تفعيل</button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
            <Key size={60} className="mb-4" />
            <p className="font-black italic">لا يوجد أكواد تتطابق مع البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 7. Admin Dashboard View ---

function AdminDashboardView({ bookings, codes, products, isDarkMode }: any) {
    const totalRevenue = bookings
        .filter((b: any) => b.status === 'Completed')
        .reduce((sum: number, b: any) => sum + b.totalPrice, 0);

    const pendingBookingsCount = bookings.filter((b: any) => b.status === 'Pending').length;
    const pendingCodesCount = codes.filter((c: any) => c.status === 'pending').length;
    const totalProducts = products.length;

    const cards = [
        { icon: TrendingUp, title: 'إجمالي الأرباح', value: formatCurrency(totalRevenue), color: 'text-pink-600', bg: 'bg-pink-50' },
        { icon: Calendar, title: 'حجوزات بانتظار التأكيد', value: pendingBookingsCount, color: 'text-amber-600', bg: 'bg-amber-50' },
        { icon: UserPlus, title: 'طلبات كود جديدة', value: pendingCodesCount, color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: Box, title: 'إجمالي قطع المخزون', value: totalProducts, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    return (
        <div className={`p-6 space-y-10 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
            <h2 className="text-3xl font-black italic">لوحة التحكم الرئيسية</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className={`p-6 rounded-[2.5rem] border shadow-lg flex flex-col justify-center items-end ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color} mb-3`}>
                            <card.icon size={24} />
                        </div>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{card.title}</p>
                        <h3 className="text-2xl font-black italic mt-1">{card.value}</h3>
                    </div>
                ))}
            </div>

            {/* أحدث الحجوزات */}
            <div className={`p-8 rounded-[3rem] border shadow-xl ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <h3 className="text-xl font-black italic text-pink-600 mb-6 flex items-center gap-2"><BarChart3 size={24}/> الأرباح الشهرية المكتملة</h3>
                
                <div className="h-64 flex items-end gap-2 pr-6">
                    <div className={`w-8 h-full rounded-md flex flex-col justify-end items-center font-bold text-xs ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                        <p className="rotate-90 whitespace-nowrap mb-16 opacity-50">الإيرادات (ر.س)</p>
                    </div>
                    {/* رسم بياني الإيرادات معطل مؤقتاً لعدم تعريف chartData/maxRevenue */}
                    {/*
                    {chartData.map(([month, revenue], index) => (
                      <div key={index} className="flex flex-col items-center flex-1 h-full justify-end">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-700 ${revenue > 0 ? 'bg-pink-600' : 'bg-gray-500'}`}
                          style={{ height: `${(revenue / maxRevenue) * 90 + 10}%` }}
                        ></div>
                        <span className={`text-xs mt-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{month.split(' ')[0]}</span>
                      </div>
                    ))}
                    */}
                </div>

                <div className="mt-10 pt-6 border-t">
                    {/* <DetailRow label="إجمالي الأرباح المكتملة" value={formatCurrency(completedBookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0))} isDarkMode={isDarkMode} valueColor="text-green-500" />
                    <DetailRow label="إجمالي عدد الحجوزات المكتملة" value={completedBookings.length} isDarkMode={isDarkMode} /> */}
                </div>
            </div>
        </div>
    );
}

// --- 8. Admin Settings View ---

function AdminSettingsView({ content, onRefresh, isDarkMode }: any) {
  const [form, setForm] = useState(content);
  const [exchangeRates, setExchangeRates] = useState({ sar_to_yer: 140, sar_to_usd: 0.27 });

  useEffect(() => {
    setForm(content);
  }, [content]);

  const handleSave = async () => {
    if (confirm('هل أنت متأكد من حفظ الإعدادات؟ سيؤثر هذا على إعدادات التطبيق العامة.')) {
      // ✅ تم التأكد من استخدام 'app_settings' هنا
      const res = await dbOperation('set', 'app_settings', { ...form, id: 'main' }, 'main');
      if ((res as any).success) {
        onRefresh();
        alert('تم حفظ الإعدادات بنجاح');
      } else {
        alert('فشل الحفظ: ' + (res as any).error);
      }
    }
  };

  const handleUpdateExchangeRates = async () => {
    if (confirm('هل أنت متأكد من تحديث أسعار الصرف؟ سيؤثر هذا على جميع العملات في التطبيق.')) {
      try {
        await dbOperation('set', 'app_settings', {
          exchange_rates: exchangeRates,
          updated_at: new Date().toISOString()
        }, 'main');
        alert('تم تحديث أسعار الصرف بنجاح');
      } catch (error) {
        alert('فشل في تحديث أسعار الصرف: ' + error);
      }
    }
  };

  return (
    <div className={`p-6 space-y-10 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
      <h2 className="text-3xl font-black italic">إعدادات التطبيق العامة</h2>

      <div className={`p-8 rounded-[3rem] border shadow-xl space-y-8 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        
        <SectionInput 
          label="كلمة مرور الإدارة (Admin Password)"
          value={form.admin_password} 
          onChange={(v:any)=>setForm({...form, admin_password:v})} 
          isDarkMode={isDarkMode} 
          info="تستخدم لتسجيل دخول المدير (افتراضياً: ADMIN123)"
        />

        <SectionInput 
          label="رسالة الترحيب الرئيسية"
          value={form.main_welcome_message} 
          onChange={(v:any)=>setForm({...form, main_welcome_message:v})} 
          isDarkMode={isDarkMode} 
          type="textarea"
        />

        <SectionInput 
          label="رابط WhatsApp للتواصل"
          value={form.whatsapp_link} 
          onChange={(v:any)=>setForm({...form, whatsapp_link:v})} 
          isDarkMode={isDarkMode} 
          info="يجب أن يبدأ بـ https://wa.me/"
        />

        <SectionInput
          label="سعر صرف الريال السعودي إلى الريال اليمني"
          value={exchangeRates.sar_to_yer}
          onChange={(v: any) => setExchangeRates({ ...exchangeRates, sar_to_yer: Number(v) })}
          isDarkMode={isDarkMode}
          type="number"
          info="السعر الحالي: 1 ر.س = X ر.ي"
        />

        <SectionInput
          label="سعر صرف الريال السعودي إلى الدولار الأمريكي"
          value={exchangeRates.sar_to_usd}
          onChange={(v: any) => setExchangeRates({ ...exchangeRates, sar_to_usd: Number(v) })}
          isDarkMode={isDarkMode}
          type="number"
          info="السعر الحالي: 1 ر.س = X $"
        />

        <div className="flex justify-center pt-8">
          <button onClick={handleSave} className="w-96 py-6 bg-pink-600 text-white rounded-[2rem] font-black italic shadow-xl hover:bg-pink-700 transition-all flex items-center justify-center gap-2">
            <Save size={20}/> حفظ التعديلات
          </button>
        </div>

        <div className="flex justify-center pt-4">
          <button onClick={handleUpdateExchangeRates} className="w-96 py-6 bg-amber-600 text-white rounded-[2rem] font-black italic shadow-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-2">
            <DollarSign size={20}/> تحديث أسعار الصرف
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 9. Store Home View (واجهة المستخدم) ---

function StoreHomeView({ products, categories, onAdd, isDarkMode }: any) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((p: any) => {
    const categoryMatch = activeCategory === 'الكل' || p.categoryId === activeCategory;
    const searchMatch = p.name && typeof p.name === 'string' && p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch && p.isAvailable;
  });

  const uniqueCategories = ['الكل', ...new Set(categories.map((c: any) => c.name))];

  return (
    <div className={`p-6 space-y-8 text-right pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''} animate-fade`}>
      <h1 className="text-3xl font-black italic text-pink-600">مرحباً بك في متجر فرحتي</h1>
      
      {/* Search and Filter */}
      <div className={`p-5 rounded-[2rem] shadow-lg flex flex-col gap-6 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
        <div className="relative">
          <Search size={20} className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن قطعة أثاث أو ديكور..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full p-4 pl-12 rounded-[1.5rem] font-bold text-sm outline-none text-right shadow-inner ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-transparent text-gray-900'}`}
          />
        </div>

        <div className="flex overflow-x-auto pb-2 scrollbar-hide">
          {uniqueCategories.map(cat => (
            <button
              key={String(cat)}
              onClick={() => setActiveCategory(String(cat))}
              className={`flex-shrink-0 px-5 py-2 mx-1 rounded-full font-bold text-sm transition-colors ${
                activeCategory === cat ? 'bg-black text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {String(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((p: any) => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} isDarkMode={isDarkMode} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 opacity-30 flex flex-col items-center">
          <ShoppingBag size={80} className="mb-4" />
          <p className="text-xl font-black italic">لا يوجد منتجات في هذا القسم أو تتطابق مع البحث</p>
        </div>
      )}
    </div>
  );
}

// --- 10. Cart Page View ---

function CartPageView({ cart, onCheckout, onRemove, isDarkMode, selectedCurrency, exchangeRates }: any) {
  // Calculate total in SAR first
  const totalSAR = cart.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0);

  // Convert to selected currency
  const convertToSelectedCurrency = (amount: number) => {
    if (selectedCurrency === 'SAR') return amount;
    if (selectedCurrency === 'YER') return amount * (exchangeRates?.sar_to_yer || 140);
    if (selectedCurrency === 'USD') return amount * (exchangeRates?.sar_to_usd || 0.27);
    return amount;
  };

  const total = convertToSelectedCurrency(totalSAR);

  return (
    <div className={`p-6 space-y-8 text-right pb-32 ${isDarkMode ? 'bg-gray-950 text-white' : ''} animate-fade`}>
      <h2 className="text-3xl font-black italic">السلة الملكية</h2>

      {cart.length === 0 ? (
        <div className="text-center py-40 opacity-30 flex flex-col items-center">
          <ShoppingCart size={80} className="mb-4" />
          <p className="text-xl font-black italic">سلتك فارغة</p>
          <Link to="/store" className="mt-4 text-pink-600 font-bold flex items-center gap-1">
            اكتشف أحدث القطع <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cart.map((item: any) => (
              <div key={item.product.id} className={`p-5 rounded-[2.5rem] border flex justify-between items-center shadow-sm ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <button onClick={() => onRemove(item.product.id)} className="text-red-500 p-3 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
                
                <div className="text-right flex-1 pr-6">
                  <h3 className={`font-black ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{item.product.name}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>الكمية: {item.quantity}</p>
                </div>

                <span className="text-lg font-black italic text-pink-600">{formatCurrency(convertToSelectedCurrency(item.product.price * item.quantity), selectedCurrency)}</span>
              </div>
            ))}
          </div>

          <div className={`p-8 rounded-[3rem] shadow-xl space-y-4 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
            <div className="flex justify-between items-center border-b pb-3">
              <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>إجمالي قيمة الإيجار:</span>
              <span className="text-xl font-black italic text-pink-600">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-3">
              <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>مبلغ التأمين (20%):</span>
              <span className="text-xl font-black italic text-amber-600">{formatCurrency(total * 0.2)}</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-xl font-black italic">الإجمالي المطلوب الآن:</span>
              <span className="text-2xl font-black italic text-black dark:text-white">{formatCurrency(total * 1.2)}</span>
            </div>
            
            <button onClick={() => onCheckout(total)} className="w-full py-6 bg-pink-600 text-white rounded-[2rem] font-black italic shadow-xl hover:bg-pink-700 transition-all flex items-center justify-center gap-2 mt-6">
              <CalendarCheck size={20}/> تأكيد الطلب ودفع مبلغ التأمين
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// --- 11. Booking Status View ---

function BookingStatusView({ bookings, products, isDarkMode }: any) {
  const { id } = useParams();
  const booking = bookings.find((b: any) => b.id === id);
  const navigate = useNavigate();

  if (!booking) return <LoadingScreen message="جاري البحث عن الحجز..." />;

  const getProduct = (productId: string) => products.find((p: any) => p.id === productId);

  return (
    <div className={`p-6 space-y-8 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-pink-600 font-bold mb-6">
        <ChevronLeft size={20} /> العودة للحجوزات
      </button>

      <div className={`p-8 rounded-[3rem] shadow-2xl ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <StatusBadge status={booking.status} />
          <div className="text-right">
            <h2 className="text-3xl font-black italic text-pink-600">حالة طلبك</h2>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{booking.id}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm font-medium">
          <DetailRow label="العميل" value={booking.user_name} isDarkMode={isDarkMode} />
          <DetailRow label="رقم الهاتف" value={booking.user_phone || 'لا يوجد'} isDarkMode={isDarkMode} />
          <DetailRow label="تاريخ الطلب" value={formatDate(booking.createdAt)} isDarkMode={isDarkMode} />
          <DetailRow label="الموقع المتوقع" value={booking.location} isDarkMode={isDarkMode} />
          
          <div className="pt-4 border-t">
             <DetailRow label="إجمالي قيمة الإيجار" value={formatCurrency(booking.totalPrice)} isDarkMode={isDarkMode} valueColor="text-pink-600" />
             <DetailRow label="مبلغ التأمين المدفوع" value={formatCurrency(booking.depositAmount)} isDarkMode={isDarkMode} valueColor="text-amber-600" />
             <DetailRow label="الإجمالي المتبقي" value={formatCurrency(booking.totalPrice - booking.depositAmount)} isDarkMode={isDarkMode} valueColor="text-black dark:text-white" />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-dashed">
          <h3 className={`text-lg font-black italic mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>القطع المحجوزة:</h3>
          <ul className="space-y-3">
            {booking.items.map((item: any, index: number) => {
              const product = getProduct(item.productId);
              return (
                <li key={index} className={`flex justify-between items-center p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <span className={`font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.name} (x{item.quantity})</span>
                  <span className="font-black italic text-pink-600">{formatCurrency((product?.price || 0) * item.quantity)}</span>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="mt-8 flex flex-col md:flex-row justify-center gap-4 no-print">
          <button onClick={() => window.print()} className="bg-black text-white px-8 py-4 rounded-[2rem] font-black italic shadow-xl hover:bg-pink-600 transition-all flex items-center gap-2">
            <Printer size={20}/> طباعة كشف الحجز
          </button>
          <button onClick={async () => {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            doc.setFont('Arial');
            doc.text('كشف الحجز', 10, 10);
            bookings.forEach((b: any, i: number) => {
              doc.text(`- ${b.id} | ${b.status} | ${b.start_date?.slice(0,10) || ''}`, 12, 20 + i * 10);
            });
            doc.save('Booking-Status.pdf');
          }} className="bg-pink-100 text-pink-700 px-8 py-4 rounded-[2rem] font-black italic shadow-xl hover:bg-pink-200 transition-all flex items-center gap-2">
            <Printer size={20}/> تصدير PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 12. Support Chat Modal (مكتملة) ---

function SupportChatModal({ isOpen, onClose, messages, onSend, user, role, isDarkMode }: any) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const currentUserId = user?.id || 'Admin';
  const filteredMessages = role === UserRole.ADMIN
    ? messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : messages.filter((m: any) => m.customer_code_id === currentUserId || m.sender_type === 'admin').sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleSend = () => {
    if (inputText.trim()) {
      onSend(inputText);
      setInputText('');
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col h-[90vh] ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button>
          <h3 className="text-xl font-black italic text-pink-600">{role === UserRole.ADMIN ? 'مركز دعم العملاء' : 'الدعم الفني'}</h3>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar">
          {filteredMessages.map((m: any) => {
            const isMe = role === UserRole.ADMIN ? m.sender_type === 'admin' : m.customer_code_id === currentUserId && m.sender_type === 'customer';
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-5 py-3 rounded-t-2xl text-sm font-medium shadow-md ${
                  isMe ? 'bg-pink-600 text-white rounded-l-2xl' : isDarkMode ? 'bg-gray-800 text-gray-100 rounded-r-2xl' : 'bg-gray-100 text-gray-800 rounded-r-2xl'
                }`}>
                  <p>{m.message}</p>
                  <span className={`text-[8px] mt-1 block ${isMe ? 'text-pink-200' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(m.created_at)}</span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-3">
          <button onClick={handleSend} className="p-4 bg-black text-white rounded-2xl active:scale-95 transition-transform"><Send size={20}/></button>
          <input
            type="text"
            placeholder="اكتب رسالتك..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            className={`flex-1 p-4 rounded-2xl font-bold text-sm outline-none text-right shadow-inner ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}
          />
        </div>
      </div>
    </div>
  );
}

// --- 13. Barcode Scanner Modal (مكتملة) ---

function BarcodeScannerModal({ isOpen, onClose, onScan }: any) {
  const [scanValue, setScanValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanning();
    } else if (!isOpen) {
      stopScanning();
    }
    return () => stopScanning();
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);

      // طلب إذن الكاميرا
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // استخدام الكاميرا الخلفية
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // بدء عملية المسح
        scanFrame();
      }
    } catch (err: any) {
      console.error('خطأ في الوصول للكاميرا:', err);
      let errorMessage = 'لا يمكن الوصول للكاميرا. ';
      if (err.name === 'NotAllowedError') {
        errorMessage += 'يرجى منح إذن الوصول للكاميرا في إعدادات المتصفح.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'لم يتم العثور على كاميرا. تأكد من توصيل كاميرا أو استخدم جهاز آخر.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'الكاميرا مستخدمة من تطبيق آخر. أغلق التطبيقات الأخرى وجرب مرة أخرى.';
      } else {
        errorMessage += 'تأكد من منح الإذن أو استخدم الإدخال اليدوي.';
      }
      setError(errorMessage);
      setIsScanning(false);
    }
  };

  const startScanningWithTimeout = async () => {
    await startScanning();
    // إيقاف المسح تلقائياً بعد 30 ثانية إذا لم يتم العثور على كود
    const timeout = setTimeout(() => {
      if (isScanning) {
        stopScanning();
        setError('انتهت مهلة المسح. جرب مرة أخرى أو استخدم الإدخال اليدوي.');
      }
    }, 30000);
    setScanTimeout(timeout);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

      if (imageData) {
        // استخدام jsqr لمسح الكود (ملاحظة: jsQR يدعم QR codes فقط، ليس barcodes العادية)
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          // تم العثور على كود
          const scannedText = code.data;
          if (scannedText && scannedText.trim()) {
            setScanValue(scannedText);
            onScan(scannedText);
            stopScanning();
            onClose();
            return;
          }
        }
      }
    }

    // استمرار المسح في الإطار التالي
    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  const handleManualScan = () => {
    if (scanValue.trim()) {
      onScan(scanValue.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md rounded-[3rem] p-8 bg-white text-gray-900 shadow-2xl space-y-6 text-right">
            <div className="flex justify-between items-center">
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button>
                <h3 className="text-xl font-black italic text-pink-600">ماسح الكود الملكي</h3>
            </div>

            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-100 rounded-2xl object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-4/5 h-1 bg-green-500 animate-pulse rounded-full shadow-lg"></div>
                </div>
              )}

              {!isScanning && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-2xl">
                  <Camera size={50} className="text-gray-400 mb-2" />
                  <p className="text-sm font-bold text-gray-500">جاري تحضير الكاميرا...</p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 rounded-2xl">
                  <AlertCircle size={50} className="text-red-400 mb-2" />
                  <p className="text-sm font-bold text-red-600 text-center px-4">{error}</p>
                </div>
              )}
            </div>

            <SectionInput
                label="إدخال يدوي"
                value={scanValue}
                onChange={setScanValue}
                isDarkMode={false}
                placeholder="أدخل الكود هنا NICE-XXXX"
            />

            <div className="flex gap-3">
              <button
                onClick={handleManualScan}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-[1.5rem] font-bold transition-colors flex items-center justify-center gap-2"
              >
                تأكيد الإدخال اليدوي
              </button>
              <button
                onClick={isScanning ? stopScanning : startScanningWithTimeout}
                className={`flex-1 py-4 rounded-[1.5rem] font-black italic shadow-xl transition-all ${
                  isScanning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-black text-white hover:bg-pink-600'
                }`}
              >
                {isScanning ? 'إيقاف المسح' : 'بدء المسح'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              قم بتوجيه الكاميرا نحو الكود الشريطي أو QR code
            </p>
        </div>
    </div>
  );
}

// --- 14. Access Gate View (مكتملة) ---

function AccessGateView({ onVerify, onScan, onRequest, isDarkMode }: any) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'request'

  const handleRequest = () => {
    if (!name.trim() || !phone.trim()) {
      alert('الرجاء إدخال الاسم ورقم الهاتف لطلب الكود.');
      return;
    }

    // Default to Saudi Arabia format for phone number
    const fullPhone = `+966${phone}`;

    onRequest(name, fullPhone);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} animate-fade`}>
      <div className={`w-full max-w-md p-10 rounded-[3rem] shadow-2xl text-right space-y-8 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
        
        <div className="text-center">
            <div className="w-16 h-16 bg-pink-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-3xl italic mb-2 mx-auto">ن</div>
            <h1 className="font-black text-pink-600 text-3xl italic leading-none tracking-tighter">Nice Events</h1>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mt-1">فرحتي لتنسيق المناسبات</p>
        </div>

        <div className="flex justify-around items-center border-b pb-2">
            <button onClick={() => setMode('login')} className={`font-black italic pb-2 transition-colors ${mode === 'login' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>الدخول بالكود</button>
            <button onClick={() => setMode('request')} className={`font-black italic pb-2 transition-colors ${mode === 'request' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>طلب كود جديد</button>
        </div>



        {mode === 'login' ? (
          <div className="space-y-6">
            <SectionInput 
                label="أدخل الكود الملكي" 
                value={code} 
                onChange={setCode} 
                isDarkMode={isDarkMode}
                placeholder="NICE-XXXX"
                type="text"
            />
            <button onClick={() => onVerify(code)} className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black italic shadow-xl hover:bg-pink-600 transition-all">
                تسجيل الدخول <ArrowRight size={16} className="inline mr-2"/>
            </button>
            <button onClick={onScan} className="w-full py-4 bg-gray-100 text-gray-700 rounded-[1.5rem] font-bold transition-colors flex items-center justify-center gap-2">
                <QrCode size={20} /> مسح الكود
            </button>
            <Link to="/login" className="text-center block text-sm font-bold text-gray-500 hover:text-pink-600">دخول الإدارة</Link>
          </div>
        ) : (
          <div className="space-y-6">
            <SectionInput 
                label="اسم العميل الكامل" 
                value={name} 
                onChange={setName} 
                isDarkMode={isDarkMode}
                placeholder="مثلاً: محمد علي"
            />
            <SectionInput 
                label="رقم الهاتف للتواصل" 
                value={phone} 
                onChange={setPhone} 
                isDarkMode={isDarkMode}
                placeholder="05XXXXXXXX"
                type="tel"
            />
            <button onClick={handleRequest} className="w-full py-5 bg-pink-600 text-white rounded-[1.5rem] font-black italic shadow-xl hover:bg-pink-700 transition-all">
                إرسال طلب الكود <UserPlus size={16} className="inline mr-2"/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 15. Admin Login View (مكتملة) ---

function AdminLoginView({ onLogin }: any) {
  const [password, setPassword] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-950 text-white animate-fade">
      <div className="w-full max-w-md p-10 rounded-[3rem] shadow-2xl bg-gray-900 border border-gray-800 text-right space-y-8">
        
        <div className="text-center">
            <div className="w-16 h-16 bg-black text-white rounded-[1.5rem] flex items-center justify-center font-black text-3xl italic mb-2 mx-auto">A</div>
            <h1 className="font-black text-amber-600 text-3xl italic leading-none tracking-tighter">Admin Access</h1>
            <p className="text-[10px] font-black text-pink-600 uppercase tracking-[0.3em] mt-1">مركز التحكم</p>
        </div>

        <SectionInput 
            label="كلمة المرور" 
            value={password} 
            onChange={setPassword} 
            isDarkMode={true}
            type="password"
        />
        <button onClick={() => onLogin(password)} className="w-full py-5 bg-pink-600 text-white rounded-[1.5rem] font-black italic shadow-xl hover:bg-pink-700 transition-all">
            تسجيل الدخول كمدير <Key size={16} className="inline mr-2"/>
        </button>
        <Link to="/access" className="text-center block text-sm font-bold text-gray-500 hover:text-pink-600">عودة إلى صفحة الكود</Link>
      </div>
    </div>
  );
}

// --- 16. Access Pending View (مكتملة) ---

function AccessPendingView({ isDarkMode }: any) {
  const navigate = useNavigate();
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} animate-fade text-center`}>
      <div className={`w-full max-w-md p-10 rounded-[3rem] shadow-2xl ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'} space-y-8`}>
        <div className="w-20 h-20 bg-amber-500 text-white rounded-[2rem] flex items-center justify-center font-black text-4xl mx-auto mb-4">
            <Clock size={40}/>
        </div>
        <h2 className="font-black italic text-2xl text-pink-600">طلبك قيد المراجعة</h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            تم استلام طلبك للحصول على كود الدخول. سيتم مراجعته والموافقة عليه من قبل الإدارة قريباً.
            سنقوم بالتواصل معك عبر الواتساب لتزويدك بالكود الملكي الخاص بك.
        </p>
        <button onClick={() => navigate('/access')} className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black italic shadow-xl hover:bg-pink-600 transition-all">
            العودة إلى صفحة الدخول
        </button>
      </div>
    </div>
  );
}

// --- 17. User Bookings View (مكتملة) ---

function UserBookingsView({ bookings, userId, isDarkMode }: any) {
    const userBookings = bookings.filter((b: any) => b.userId === userId);

    return (
        <div className={`p-6 space-y-8 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
            <h2 className="text-3xl font-black italic">حجوزاتي السابقة</h2>

            <div className="space-y-4">
                {userBookings.length > 0 ? (
                    userBookings.map((b: any) => (
                        <Link to={`/booking-status/${b.id}`} key={b.id} className={`block p-6 rounded-[2.5rem] border shadow-md transition-all hover:shadow-xl ${isDarkMode ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                            <div className="flex justify-between items-center">
                                <StatusBadge status={b.status} />
                                <div className="text-right">
                                    <h3 className={`text-xl font-black italic ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{b.id}</h3>
                                    <p className={`text-sm font-bold text-pink-600`}>{formatCurrency(b.total_price)}</p>
                                </div>
                            </div>
                            <p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>تاريخ الطلب: {formatDate(b.createdAt)}</p>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-20 opacity-30 flex flex-col items-center">
                        <Calendar size={80} className="mb-4" />
                        <p className="text-xl font-black italic">لم تقم بأي حجوزات بعد</p>
                        <Link to="/store" className="mt-4 text-pink-600 font-bold flex items-center gap-1">
                            ابدأ الحجز الآن <ArrowRight size={16} />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- 18. Admin Reports View (مكتملة) ---

function AdminReportsView({ bookings, isDarkMode }: any) {
    const completedBookings = bookings.filter((b: any) => b.status === 'Completed');
    const monthlyRevenue: { [key: string]: number } = {};

    completedBookings.forEach((b: any) => {
        const monthYear = new Date(b.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + b.totalPrice;
    });

    const chartData = Object.entries(monthlyRevenue).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
    const maxRevenue = Math.max(...Object.values(monthlyRevenue), 1);

    return (
        <div className={`p-6 space-y-10 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
            <h2 className="text-3xl font-black italic">تقارير الأداء</h2>
            
            <div className={`p-8 rounded-[3rem] border shadow-xl ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <h3 className="text-xl font-black italic text-pink-600 mb-8 flex items-center gap-2"><BarChart3 size={24}/> الأرباح الشهرية المكتملة</h3>
                
                <div className="h-64 flex items-end gap-2 pr-6">
                    <div className={`w-8 h-full rounded-md flex flex-col justify-end items-center font-bold text-xs ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                        <p className="rotate-90 whitespace-nowrap mb-16 opacity-50">الإيرادات (ر.س)</p>
                    </div>
                    {chartData.map(([month, revenue], index) => (
                        <div key={index} className="flex flex-col items-center flex-1 h-full justify-end">
                            <div 
                                className={`w-full rounded-t-lg transition-all duration-700 ${revenue > 0 ? 'bg-pink-600' : 'bg-gray-500'}`}
                                style={{ height: `${(revenue / maxRevenue) * 90 + 10}%` }}
                            ></div>
                            <span className={`text-xs mt-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{month.split(' ')[0]}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-6 border-t">
                    <DetailRow label="إجمالي الأرباح المكتملة" value={formatCurrency(completedBookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0))} isDarkMode={isDarkMode} valueColor="text-green-500" />
                    <DetailRow label="إجمالي عدد الحجوزات المكتملة" value={completedBookings.length} isDarkMode={isDarkMode} />
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// --- المكونات الفرعية (Utilities) ---
// ----------------------------------------------------------------------

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

function ProductCard({ product, onAdd, isDarkMode }: any) {
    return (
        <div className={`group relative flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-[2.5rem] border shadow-sm overflow-hidden transition-all hover:shadow-xl`}>
            <div className="h-48 overflow-hidden relative">
                <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            
            <div className="p-6 text-right flex-1 flex flex-col justify-between">
                <div>
                    <span className="text-[8px] font-black text-pink-600 uppercase tracking-widest">{product.categoryId}</span>
                    <h4 className={`text-sm font-black mt-1 line-clamp-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{product.name}</h4>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-black italic text-pink-600">{formatCurrency(product.price)}</span>
                    <button onClick={() => onAdd(product)} className="p-3 bg-black text-white rounded-xl shadow-lg hover:bg-pink-600 transition-all active:scale-90">
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, type = 'booking' }: { status: string, type?: 'booking' | 'code' }) {
    let color, text;
    switch (status) {
        case 'Pending':
        case 'pending':
            color = 'bg-amber-500/10 text-amber-600';
            text = type === 'booking' ? 'بانتظار التأكيد' : 'بانتظار الموافقة';
            break;
        case 'Confirmed':
        case 'approved':
            color = 'bg-green-500/10 text-green-600';
            text = type === 'booking' ? 'مؤكد' : 'مفعل';
            break;
        case 'Completed':
            color = 'bg-pink-600/10 text-pink-600';
            text = 'مكتمل';
            break;
        case 'Cancelled':
        case 'blocked':
            color = 'bg-red-500/10 text-red-600';
            text = type === 'booking' ? 'ملغى' : 'محظور';
            break;
        default:
            color = 'bg-gray-500/10 text-gray-600';
            text = 'غير معروف';
    }
    return (
        <span className={`px-4 py-1 rounded-full font-bold text-xs ${color} flex items-center gap-1 shadow-md`}>
            {text}
        </span>
    );
}

function Toast({ message, type, onClose }: any) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="fixed top-24 right-6 z-[1000] animate-in slide-in-from-top duration-300">
      <div className={`flex items-center gap-3 p-4 rounded-xl text-white font-bold shadow-lg ${bgColor}`}>
        {type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
        <span>{message}</span>
        <button onClick={onClose} className="p-1"><X size={16}/></button>
      </div>
    </div>
  );
}

function AdminDrawer({ isOpen, onClose, onLogout, isDarkMode }: any) {
    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose();
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/admin' },
        { icon: Box, label: 'إدارة المخزون', path: '/admin/products' },
        { icon: Folders, label: 'إدارة الأقسام', path: '/admin/categories' },
        { icon: Calendar, label: 'إدارة الحجوزات', path: '/admin/bookings' },
        { icon: Key, label: 'إدارة الأكواد', path: '/admin/codes' },
        { icon: QrCode, label: 'مولد الكروت', path: '/admin/card-generator' },
        { icon: BarChart3, label: 'التقارير', path: '/admin/reports' },
        { icon: Layers, label: 'إدارة الصفحات', path: '/pages' },
        { icon: Settings, label: 'الإعدادات العامة', path: '/admin/settings' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex justify-end">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`w-80 h-full p-6 shadow-2xl z-[400] transition-transform duration-300 transform translate-x-0 ${isDarkMode ? 'bg-gray-900 border-l border-gray-800' : 'bg-white text-gray-900'}`}>
                
                <div className="flex justify-between items-center pb-6 border-b">
                    <button onClick={onClose} className="p-2 hover:text-red-500"><X size={24}/></button>
                    <div className="text-right">
                        <h3 className="font-black italic text-pink-600">Admin Panel</h3>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>مركز التحكم</p>
                    </div>
                </div>

                <nav className="mt-8 space-y-2 text-right">
                    {navItems.map(item => (
                        <button key={item.path} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center justify-end gap-3 p-4 rounded-2xl font-bold transition-colors ${location.pathname.startsWith(item.path) && item.path !== '/admin' ? 'bg-pink-600 text-white' : location.pathname === '/admin' && item.path === '/admin' ? 'bg-pink-600 text-white' : isDarkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-6 w-[calc(100%-48px)]">
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 bg-red-500 text-white rounded-2xl font-black italic hover:bg-red-600 transition-colors">
                        <LogOut size={20} />
                        تسجيل الخروج
                    </button>
                </div>

            </div>
        </div>
    );
}

function UserBottomNav({ cartCount, onLogout }: any) {
  const location = useLocation();

    const navItems = [
      { icon: Home, label: 'المتجر', path: '/store' },
      { icon: Calendar, label: 'حجوزاتي', path: '/bookings' },
      { icon: ShoppingCart, label: 'السلة', path: '/cart', count: cartCount },
      { icon: User, label: 'حسابي', path: '/profile' },
      { icon: Settings, label: 'الإعدادات', path: '/settings' },
    ];

    return (
        <footer className="fixed bottom-0 inset-x-0 z-[200] bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] p-3 no-print">
            <div className="flex justify-around items-center">
                {navItems.map(item => (
                    <Link to={item.path} key={item.path} className={`flex flex-col items-center p-2 rounded-xl transition-colors relative ${location.pathname === item.path ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                        {item.icon === ShoppingCart && item.count > 0 && <span className="absolute top-0 left-1 w-5 h-5 bg-pink-500 rounded-full text-[9px] flex items-center justify-center font-black text-white">{item.count}</span>}
                        <item.icon size={20} />
                        <span className="text-xs font-medium mt-1">{item.label}</span>
                    </Link>
                ))}
                <button onClick={onLogout} className="flex flex-col items-center p-2 rounded-xl transition-colors text-red-500 hover:text-red-600">
                    <LogOut size={20} />
                    <span className="text-xs font-medium mt-1">خروج</span>
                </button>
            </div>
        </footer>
    );
}

function ProtectedRoute({ children, role, adminOnly }: any) {
    if (adminOnly && role !== UserRole.ADMIN) {
        return <Navigate to="/access" replace />;
    }
    if (!role) {
        return <Navigate to="/access" replace />;
    }
    return children;
}

function LoadingScreen({ message = "جاري تحميل البيانات..." }: { message?: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-600 mb-4"></div>
            <p className="font-black italic text-pink-600">{message}</p>
        </div>
    );
}

function SplashScreen({ onFinish }: any) {
    useEffect(() => {
        const timer = setTimeout(onFinish, 1500);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-pink-600 text-white rounded-[2.5rem] flex items-center justify-center font-black text-5xl italic mb-3 shadow-xl">ن</div>
            <h1 className="font-black text-pink-600 text-4xl italic leading-none tracking-tighter">Nice Events</h1>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mt-1">فرحتي لتنسيق المناسبات</p>
        </div>
    );
}

function DetailRow({ label, value, isDarkMode, valueColor }: any) {
    return (
        <div className="flex justify-between items-center py-2">
            <span className={`font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}:</span>
            <span className={`font-black italic ${valueColor || (isDarkMode ? 'text-white' : 'text-gray-800')}`}>{value}</span>
        </div>
    );
}

// --- User Profile View (مكتملة) ---

function UserProfileView({ user, bookings, chatMessages, onSendMessage, isDarkMode }: any) {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const userBookings = bookings.filter((b: any) => b.userId === user?.id);
  const totalSpent = userBookings
    .filter((b: any) => b.status === 'Completed')
    .reduce((sum: number, b: any) => sum + b.totalPrice, 0);

  // --- Export/Backup Logic ---
  const handleExportJSON = () => {
    const data = {
      user,
      bookings: userBookings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NiceEvents-Backup-${user?.customer_name || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('Arial');
    doc.text(`بيانات المستخدم: ${user?.customer_name || ''}`, 10, 10);
    doc.text(`رقم الهاتف: ${user?.user_phone || ''}`, 10, 20);
    doc.text(`الكود: ${user?.code || ''}`, 10, 30);
    doc.text('الحجوزات:', 10, 40);
    userBookings.forEach((b: any, i: number) => {
      doc.text(`- ${b.id} | ${b.status} | ${b.start_date?.slice(0,10) || ''}`, 12, 50 + i * 10);
    });
    doc.save(`NiceEvents-Backup-${user?.customer_name || 'user'}.pdf`);
  };

  return (
    <>
      <div className={`p-6 space-y-8 text-right animate-fade pb-32 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
        <h2 className="text-3xl font-black italic">حسابي الشخصي</h2>

        {/* Export/Backup Buttons */}
        <div className="flex gap-4 mb-4 no-print">
          <button onClick={handleExportJSON} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-200 transition-all"><Download size={18}/> نسخ احتياطي (JSON)</button>
          <button onClick={handleExportPDF} className="bg-pink-100 text-pink-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-pink-200 transition-all"><Printer size={18}/> تصدير PDF</button>
        </div>

        {/* User Info Card */}
        <div className={`p-8 rounded-[3rem] shadow-xl ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-pink-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-xl">
              {user?.customer_name?.charAt(0) || 'U'}
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-black italic text-pink-600">{user?.customer_name}</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user?.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="رقم الهاتف" value={user?.user_phone || 'غير محدد'} isDarkMode={isDarkMode} />
            <DetailRow label="الرصيد الحالي" value={formatCurrency(user?.walletBalance || 0)} valueColor="text-amber-600" isDarkMode={isDarkMode} />
            <DetailRow label="إجمالي المشتريات" value={formatCurrency(totalSpent)} valueColor="text-green-600" isDarkMode={isDarkMode} />
            <DetailRow label="عدد الحجوزات" value={userBookings.length} isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`p-6 rounded-[2.5rem] shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
          <h3 className="text-xl font-black italic text-pink-600 mb-4">الإجراءات السريعة</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/store" className="p-4 bg-pink-50 text-pink-600 rounded-2xl font-bold text-center hover:bg-pink-100 transition-colors">
              <ShoppingBag size={24} className="mx-auto mb-2" />
              تسوق الآن
            </Link>
            <Link to="/bookings" className="p-4 bg-blue-50 text-blue-600 rounded-2xl font-bold text-center hover:bg-blue-100 transition-colors">
              <Calendar size={24} className="mx-auto mb-2" />
              حجوزاتي
            </Link>
            <Link to="/cart" className="p-4 bg-amber-50 text-amber-600 rounded-2xl font-bold text-center hover:bg-amber-100 transition-colors">
              <ShoppingCart size={24} className="mx-auto mb-2" />
              سلتي
            </Link>
            <button onClick={() => setIsSupportOpen(true)} className="p-4 bg-green-50 text-green-600 rounded-2xl font-bold text-center hover:bg-green-100 transition-colors">
              <MessageSquare size={24} className="mx-auto mb-2" />
              الدعم الفني
            </button>
          </div>
        </div>
      </div>

      <SupportChatModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} messages={chatMessages} onSend={onSendMessage} user={user} role={UserRole.USER} isDarkMode={isDarkMode} />
    </>
  );
}

// --- Notifications View (عرض الإشعارات) ---

function NotificationsView({ userId, isDarkMode }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      try {
        // Assuming notifications are stored in a table, fetch them
        const res = await dbOperation('get', 'notifications', { user_id: userId });
        if ((res as any).success) {
          setNotifications((res as any).data || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await dbOperation('update', 'notifications', { is_read: true }, id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) return <LoadingScreen message="جاري تحميل الإشعارات..." />;

  return (
    <div className={`p-6 space-y-8 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
      <h2 className="text-3xl font-black italic">الإشعارات</h2>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification: any) => (
            <div key={notification.id} className={`p-6 rounded-[2.5rem] border shadow-md transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} ${!notification.is_read ? 'border-l-4 border-l-pink-600' : ''}`}>
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div className="flex gap-3">
                  {!notification.is_read && (
                    <button onClick={() => markAsRead(notification.id)} className="text-pink-600 p-2 hover:bg-pink-50 rounded-xl transition-colors">
                      <CheckCircle size={20} />
                    </button>
                  )}
                </div>
                <div className="text-right flex-1">
                  <h3 className={`text-xl font-black italic ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{notification.title}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(notification.created_at)}</p>
                </div>
              </div>

              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{notification.message}</p>

              {notification.data && notification.data.code && (
                <div className="mt-4 p-3 bg-pink-50 rounded-xl">
                  <p className="text-sm font-bold text-pink-600">كود الدخول: {notification.data.code}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-30 flex flex-col items-center">
            <Bell size={80} className="mb-4" />
            <p className="text-xl font-black italic">لا توجد إشعارات</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Pages View (عرض جميع الصفحات حسب الصلاحيات) ---

function PagesView({ role, isDarkMode }: any): React.JSX.Element {
  const [pages, setPages] = useState([
    { name: 'المتجر', path: '/store', description: 'تصفح وتسوق قطع الأثاث والديكور', role: 'user' },
    { name: 'حجوزاتي', path: '/bookings', description: 'عرض جميع حجوزاتك السابقة', role: 'user' },
    { name: 'السلة', path: '/cart', description: 'عرض وإدارة سلة التسوق', role: 'user' },
    { name: 'حسابي', path: '/profile', description: 'إدارة حسابك الشخصي', role: 'user' },
    { name: 'الإشعارات', path: '/notifications', description: 'عرض جميع الإشعارات', role: 'user' },
    { name: 'لوحة التحكم', path: '/admin', description: 'لوحة تحكم الإدارة الرئيسية', role: 'admin' },
    { name: 'إدارة المخزون', path: '/admin/products', description: 'إضافة وتعديل قطع المخزون', role: 'admin' },
    { name: 'إدارة الأقسام', path: '/admin/categories', description: 'إدارة أقسام المنتجات', role: 'admin' },
    { name: 'إدارة الحجوزات', path: '/admin/bookings', description: 'مراجعة وإدارة جميع الحجوزات', role: 'admin' },
    { name: 'إدارة الأكواد', path: '/admin/codes', description: 'إدارة أكواد العملاء', role: 'admin' },
    { name: 'مولد الكروت', path: '/admin/card-generator', description: 'توليد كروت العملاء الجديدة', role: 'admin' },
    { name: 'التقارير', path: '/admin/reports', description: 'عرض تقارير الأداء والإحصائيات', role: 'admin' },
    { name: 'الإعدادات', path: '/admin/settings', description: 'إعدادات التطبيق العامة', role: 'admin' },
  ]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedDescription, setEditedDescription] = useState('');

  const handleEdit = (index: number, currentDescription: string) => {
    setEditingIndex(index);
    setEditedDescription(currentDescription);
  };

  const handleSave = (index: number) => {
    const updatedPages = [...pages];
    updatedPages[index].description = editedDescription;
    setPages(updatedPages);
    setEditingIndex(null);
    setEditedDescription('');
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditedDescription('');
  };

  const filteredPages = pages.filter(page => page.role === 'user' || role === UserRole.ADMIN);

  return (
    <div className={`p-6 space-y-8 text-right animate-fade pb-24 ${isDarkMode ? 'bg-gray-950 text-white' : ''}`}>
      <h2 className="text-3xl font-black italic">جميع الصفحات المتاحة</h2>

      <div className="space-y-4">
        {filteredPages.map((page, index) => (
          <div key={page.path} className={`p-6 rounded-[2.5rem] border shadow-md transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div className="flex gap-3">
                {role === UserRole.ADMIN && (
                  <>
                    {editingIndex === index ? (
                      <>
                        <button onClick={() => handleSave(index)} className="text-green-500 p-2 hover:bg-green-50 rounded-xl transition-colors"><CheckCircle size={20} /></button>
                        <button onClick={handleCancel} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors"><X size={20} /></button>
                      </>
                    ) : (
                      <button onClick={() => handleEdit(index, page.description)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={20} /></button>
                    )}
                  </>
                )}
              </div>
              <div className="text-right flex-1">
                <div className="flex items-center justify-end gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${page.role === 'admin' ? 'bg-pink-500/10 text-pink-600' : 'bg-blue-500/10 text-blue-600'}`}>
                    {page.role === 'admin' ? 'إدارة' : 'مستخدم'}
                  </span>
                  <h3 className={`text-xl font-black italic ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{page.name}</h3>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{page.path}</p>
              </div>
            </div>

            {editingIndex === index ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className={`w-full p-4 rounded-[1.5rem] font-bold text-sm outline-none text-right shadow-inner resize-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-transparent text-gray-900'}`}
                rows={3}
              />
            ) : (
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{page.description}</p>
            )}
          </div>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <div className="text-center py-20 opacity-30 flex flex-col items-center">
          <Layers size={80} className="mb-4" />
          <p className="font-black italic">لا توجد صفحات متاحة</p>
        </div>
      )}
    </div>
  );
}