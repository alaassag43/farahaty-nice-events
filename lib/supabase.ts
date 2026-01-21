import { createClient } from '@supabase/supabase-js';

// يتم جلب البيانات من البيئة البرمجية، وفي حال عدم وجودها يتم استخدام قيم افتراضية للتطوير
const supabaseUrl = process.env.SUPABASE_URL || 'https://bsvndoharrcopsnnfspp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdm5kb2hhcnJjb3Bzbm5mc3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjIxMzAsImV4cCI6MjA4NDIzODEzMH0.SRuuoSHejzVsmOrVMVa3eB-bLynr-I_A32nzid2uTNw';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * دالة موحدة لإجراء العمليات على قاعدة بيانات Supabase
 */
export const supabaseOperation = async (
  type: 'get' | 'set' | 'update' | 'delete',
  table: string,
  data?: any,
  id?: string,
  options?: { select?: string }
) => {
  try {
    switch (type) {
      case 'get':
        const select = options?.select || '*';
        const { data: getData, error: getError } = await supabase
          .from(table)
          .select(select)
          .order('created_at', { ascending: false });
        if (getError) throw getError;
        return { success: true, data: getData };

      case 'set':
        const { data: setData, error: setError } = await supabase
          .from(table)
          .upsert({ ...data, id: id || undefined })
          .select();
        if (setError) throw setError;
        return { success: true, data: setData };

      case 'update':
        // لا تستخدم select مع update (Supabase REST لا يدعم ذلك)
        const { data: updateData, error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq('id', id);
        if (updateError) throw updateError;
        return { success: true, data: updateData };

      case 'delete':
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (deleteError) throw deleteError;
        return { success: true, data: true };

      default:
        return { success: false, error: 'Invalid operation type' };
    }
  } catch (error) {
    console.error(`Supabase Error [${table}]:`, error);
    // العودة للبيانات المحلية في حال فشل الاتصال (اختياري)
    return { success: false, error: error.message };
  }
};

// وظيفة المساعدة لرفع الصور (تحتاج لإعداد Storage في Supabase)
export const uploadToSupabase = async (file: File, bucket: string = 'gallery') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

/**
 * وظائف التفاعل الفوري (Real-time)
 */

// اشتراك في تحديثات المنتجات
export const subscribeToProducts = (callback: (products: any[]) => void) => {
  return supabase
    .channel('products_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      console.log('Products change:', payload);
      // إعادة جلب البيانات عند أي تغيير
      supabaseOperation('get', 'products').then(res => (res as any).success ? callback((res as any).data) : null);
    })
    .subscribe();
};

// اشتراك في تحديثات الفئات
export const subscribeToCategories = (callback: (categories: any[]) => void) => {
  return supabase
    .channel('categories_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
      console.log('Categories change:', payload);
      // إعادة جلب البيانات عند أي تغيير
      supabaseOperation('get', 'categories').then(res => (res as any).success ? callback((res as any).data || []) : callback([]));
    })
    .subscribe();
};

// اشتراك في تحديثات الحجوزات
export const subscribeToBookings = (callback: (bookings: any[]) => void) => {
  return supabase
    .channel('bookings_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
      console.log('Bookings change:', payload);
      // إعادة جلب البيانات عند أي تغيير
      supabaseOperation('get', 'bookings').then(res => (res as any).success ? callback((res as any).data) : null);
    })
    .subscribe();
};

// اشتراك في تحديثات أكواد العملاء
export const subscribeToCustomerCodes = (callback: (codes: any[]) => void) => {
  return supabase
    .channel('customer_codes_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_codes' }, (payload) => {
      console.log('Customer codes change:', payload);
      // إعادة جلب البيانات عند أي تغيير
      supabaseOperation('get', 'customer_codes').then(res => (res as any).success ? callback((res as any).data) : null);
    })
    .subscribe();
};

// اشتراك في تحديثات الرسائل
export const subscribeToMessages = (callback: (messages: any[]) => void) => {
  return supabase
    .channel('messages_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
      console.log('Messages change:', payload);
      // إعادة جلب البيانات عند أي تغيير
      supabaseOperation('get', 'chat_messages').then(res => (res as any).success ? callback((res as any).data) : null);
    })
    .subscribe();
};

// اشتراك في الإشعارات
export const subscribeToNotifications = (callback: (notifications: any[]) => void) => {
  return supabase
    .channel('notifications_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
      console.log('Notifications change:', payload);
      // إعادة جلب البيانات عند أي تغيير
      supabaseOperation('get', 'notifications').then(res => (res as any).success ? callback((res as any).data) : null);
    })
    .subscribe();
};

// إرسال إشعار لجميع المستخدمين
export const sendGlobalNotification = async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const id = `notif-${Date.now()}`;
  return await supabaseOperation('set', 'notifications', {
    id,
    title,
    message,
    type,
    target_user_id: null, // null للجميع
    created_at: new Date().toISOString(),
    is_read: false
  }, id);
};

// إرسال إشعار لمستخدم محدد
export const sendUserNotification = async (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const id = `notif-${Date.now()}`;
  return await supabaseOperation('set', 'notifications', {
    id,
    title,
    message,
    type,
    target_user_id: userId,
    created_at: new Date().toISOString(),
    is_read: false
  }, id);
};
