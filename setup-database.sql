-- إعداد قاعدة البيانات لتطبيق فرحتي - المناسبات
-- قم بنسخ هذا الملف إلى SQL Editor في Supabase Dashboard واضغط Run

-- تفعيل الامتدادات المطلوبة
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- حذف الجداول الموجودة (إذا كانت موجودة)
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS customer_codes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- إنشاء جدول الفئات
CREATE TABLE categories (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المنتجات
CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  images JSONB DEFAULT '[]'::jsonb,
  category_id VARCHAR(255),
  is_available BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 1,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول أكواد العملاء
CREATE TABLE customer_codes (
  id VARCHAR(255) PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  user_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'blocked')),
  is_active BOOLEAN DEFAULT false,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الحجوزات
CREATE TABLE bookings (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  total_price DECIMAL(10,2),
  location TEXT DEFAULT 'سيتم التحديد عند التواصل',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items JSONB DEFAULT '[]'::jsonb,
  deposit_amount DECIMAL(10,2) DEFAULT 0
);

-- إنشاء جدول رسائل الدردشة
CREATE TABLE chat_messages (
  id VARCHAR(255) PRIMARY KEY,
  customer_code_id VARCHAR(255),
  sender_type TEXT DEFAULT 'customer' CHECK (sender_type IN ('customer', 'admin')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول إعدادات التطبيق
CREATE TABLE app_settings (
  id VARCHAR(255) PRIMARY KEY,
  admin_password TEXT DEFAULT 'ADMIN123',
  main_welcome_message TEXT DEFAULT 'مرحباً بك في تطبيق فرحتي لتنسيق المناسبات',
  whatsapp_link TEXT DEFAULT 'https://wa.me/',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج بيانات تجريبية
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

-- إدراج إعدادات التطبيق الافتراضية
INSERT INTO app_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- تفعيل RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات
CREATE POLICY "Allow read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow read access to customer_codes" ON customer_codes FOR SELECT USING (true);
CREATE POLICY "Allow read access to bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow read access to chat_messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow read access to app_settings" ON app_settings FOR SELECT USING (true);

CREATE POLICY "Allow insert to bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to customer_codes" ON customer_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to app_settings" ON app_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update to bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Allow update to chat_messages" ON chat_messages FOR UPDATE USING (true);
CREATE POLICY "Allow update to customer_codes" ON customer_codes FOR UPDATE USING (true);
CREATE POLICY "Allow update to products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow update to categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow update to app_settings" ON app_settings FOR UPDATE USING (true);

CREATE POLICY "Allow delete to bookings" ON bookings FOR DELETE USING (true);
CREATE POLICY "Allow delete to chat_messages" ON chat_messages FOR DELETE USING (true);
CREATE POLICY "Allow delete to customer_codes" ON customer_codes FOR DELETE USING (true);
CREATE POLICY "Allow delete to products" ON products FOR DELETE USING (true);
CREATE POLICY "Allow delete to categories" ON categories FOR DELETE USING (true);
CREATE POLICY "Allow delete to app_settings" ON app_settings FOR DELETE USING (true);