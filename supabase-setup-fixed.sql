-- إعداد قاعدة البيانات لتطبيق فرحتي - المناسبات
-- نسخة مبسطة ومصححة لـ Supabase

-- تفعيل RLS على جميع الجداول
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "customer_codes_select" ON customer_codes;
DROP POLICY IF EXISTS "customer_codes_insert" ON customer_codes;
DROP POLICY IF EXISTS "customer_codes_update" ON customer_codes;
DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_update" ON bookings;
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON chat_messages;
DROP POLICY IF EXISTS "app_settings_select" ON app_settings;
DROP POLICY IF EXISTS "app_settings_insert" ON app_settings;
DROP POLICY IF EXISTS "app_settings_update" ON app_settings;

-- إنشاء الجداول
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  images JSONB DEFAULT '[]'::jsonb,
  category_id TEXT,
  is_available BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 1,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  user_phone TEXT,
  status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT false,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Pending',
  total_price DECIMAL(10,2),
  location TEXT DEFAULT 'سيتم التحديد عند التواصل',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  items JSONB DEFAULT '[]'::jsonb,
  deposit_amount DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  customer_code_id TEXT,
  sender_type TEXT DEFAULT 'customer',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  admin_password TEXT DEFAULT 'ADMIN123',
  main_welcome_message TEXT DEFAULT 'مرحباً بك في تطبيق فرحتي لتنسيق المناسبات',
  whatsapp_link TEXT DEFAULT 'https://wa.me/',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج البيانات التجريبية
INSERT INTO categories (id, name, description) VALUES
('cat_1', 'حلويات', 'تشكيلة متنوعة من الحلويات العربية والغربية'),
('cat_2', 'كيك', 'كيك احتفالي بأشكال ونكهات متنوعة'),
('cat_3', 'معجنات', 'معجنات طازجة بمكونات عالية الجودة'),
('cat_4', 'مشروبات', 'مشروبات باردة وساخنة للمناسبات')
ON CONFLICT (name) DO NOTHING;

INSERT INTO customer_codes (id, code, customer_name, user_phone) VALUES
('cust_001', 'NICE-0001', 'أحمد محمد', '+966501234567'),
('cust_002', 'NICE-0002', 'فاطمة علي', '+966507654321'),
('cust_003', 'NICE-0003', 'محمد أحمد', '+966509876543')
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (id, name, description, price, category_id) VALUES
('prod_1', 'كيك عيد ميلاد', 'كيك عيد ميلاد مزخرف بألوان جميلة', 150.00, 'cat_2'),
('prod_2', 'كنافة', 'كنافة بالقشطة الطازجة', 80.00, 'cat_1'),
('prod_3', 'بقلاوة', 'بقلاوة سورية أصيلة', 120.00, 'cat_1')
ON CONFLICT (id) DO NOTHING;

-- إنشاء السياسات
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (true);

CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update" ON products FOR UPDATE USING (true);

CREATE POLICY "customer_codes_select" ON customer_codes FOR SELECT USING (true);
CREATE POLICY "customer_codes_insert" ON customer_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "customer_codes_update" ON customer_codes FOR UPDATE USING (true);

CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (true);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (true);

CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_messages_update" ON chat_messages FOR UPDATE USING (true);

CREATE POLICY "app_settings_select" ON app_settings FOR SELECT USING (true);
CREATE POLICY "app_settings_insert" ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "app_settings_update" ON app_settings FOR UPDATE USING (true);
