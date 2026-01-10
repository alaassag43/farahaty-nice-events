-- إعداد قاعدة البيانات لتطبيق فرحتي - المناسبات

-- تفعيل RLS (Row Level Security)
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_codes ENABLE ROW LEVEL SECURITY;

-- جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول أكواد العملاء
CREATE TABLE IF NOT EXISTS customer_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الحجوزات
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_code_id UUID REFERENCES customer_codes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_time TIME,
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول رسائل الدردشة
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  sender_type TEXT DEFAULT 'customer' CHECK (sender_type IN ('customer', 'admin', 'system')),
  customer_code_id UUID REFERENCES customer_codes(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج بيانات تجريبية
INSERT INTO categories (name, description) VALUES
('حلويات', 'تشكيلة متنوعة من الحلويات العربية والغربية'),
('كيك', 'كيك احتفالي بأشكال ونكهات متنوعة'),
('معجنات', 'معجنات طازجة بمكونات عالية الجودة'),
('مشروبات', 'مشروبات باردة وساخنة للمناسبات')
ON CONFLICT (name) DO NOTHING;

INSERT INTO customer_codes (code, customer_name, phone) VALUES
('NICE-0001', 'أحمد محمد', '+966501234567'),
('NICE-0002', 'فاطمة علي', '+966507654321'),
('NICE-0003', 'محمد أحمد', '+966509876543')
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (name, description, price, category_id) VALUES
('كيك عيد ميلاد', 'كيك عيد ميلاد مزخرف بألوان جميلة', 150.00, (SELECT id FROM categories WHERE name = 'كيك' LIMIT 1)),
('كنافة', 'كنافة بالقشطة الطازجة', 80.00, (SELECT id FROM categories WHERE name = 'حلويات' LIMIT 1)),
('بقلاوة', 'بقلاوة سورية أصيلة', 120.00, (SELECT id FROM categories WHERE name = 'حلويات' LIMIT 1))
ON CONFLICT DO NOTHING;

-- إنشاء سياسات RLS للسماح بالقراءة للجميع
CREATE POLICY "Allow read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow read access to customer_codes" ON customer_codes FOR SELECT USING (true);
CREATE POLICY "Allow read access to bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow read access to chat_messages" ON chat_messages FOR SELECT USING (true);

-- إنشاء سياسات للكتابة (يمكن تعديلها حسب الحاجة)
CREATE POLICY "Allow insert to bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Allow update to chat_messages" ON chat_messages FOR UPDATE USING (true);
