-- *******************************************************************
-- 1. تفعيل الامتدادات المطلوبة (للتأكد)
-- *******************************************************************
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- *******************************************************************
-- 2. حذف الجداول الموجودة لتجنب التنازع (DROP)
-- *******************************************************************
-- تنفيذ أمر الحذف هذا يضمن بدء عملية إنشاء نظيفة
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS customer_codes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- *******************************************************************
-- 3. إعداد قاعدة البيانات لتطبيق فرحتي - المناسبات (CREATE)
-- *******************************************************************

-- جدول الفئات (تم إضافة عمود description لتطابق INSERT)
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(255) PRIMARY KEY, 
  name TEXT NOT NULL UNIQUE,
  description TEXT, -- تم إضافة هذا العمود
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
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

-- جدول أكواد العملاء
CREATE TABLE IF NOT EXISTS customer_codes (
  id VARCHAR(255) PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  user_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'blocked')),
  is_active BOOLEAN DEFAULT false,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الحجوزات
CREATE TABLE IF NOT EXISTS bookings (
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

-- جدول رسائل الدردشة
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(255) PRIMARY KEY,
  customer_code_id VARCHAR(255),
  sender_type TEXT DEFAULT 'customer' CHECK (sender_type IN ('customer', 'admin')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول إعدادات التطبيق
CREATE TABLE IF NOT EXISTS app_settings (
  id VARCHAR(255) PRIMARY KEY,
  admin_password TEXT DEFAULT 'ADMIN123',
  main_welcome_message TEXT DEFAULT 'مرحباً بك في تطبيق فرحتي لتنسيق المناسبات',
  whatsapp_link TEXT DEFAULT 'https://wa.me/',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- *******************************************************************
-- 4. إدراج البيانات التجريبية (INSERT) - تم تصحيح بناء الجملة (FIXED)
-- *******************************************************************

-- جدول categories
INSERT INTO categories (id, name, description) VALUES
('cat_1', 'حلويات', 'تشكيلة متنوعة من الحلويات العربية والغربية'),
('cat_2', 'كيك', 'كيك احتفالي بأشكال ونكهات متنوعة'),
('cat_3', 'معجنات', 'معجنات طازجة بمكونات عالية الجودة'),
('cat_4', 'مشروبات', 'مشروبات باردة وساخنة للمناسبات')
ON CONFLICT (name) DO NOTHING; -- التصحيح: ON CONFLICT مرة واحدة في النهاية

-- جدول customer_codes
INSERT INTO customer_codes (id, code, customer_name, user_phone) VALUES
('cust_001', 'NICE-0001', 'أحمد محمد', '+966501234567'),
('cust_002', 'NICE-0002', 'فاطمة علي', '+966507654321'),
('cust_003', 'NICE-0003', 'محمد أحمد', '+966509876543')
ON CONFLICT (code) DO NOTHING; -- التصحيح: ON CONFLICT مرة واحدة في النهاية

-- جدول products
INSERT INTO products (id, name, description, price, category_id) VALUES
('prod_1', 'كيك عيد ميلاد', 'كيك عيد ميلاد مزخرف بألوان جميلة', 150.00, 'cat_2'),
('prod_2', 'كنافة', 'كنافة بالقشطة الطازجة', 80.00, 'cat_1'),
('prod_3', 'بقلاوة', 'بقلاوة سورية أصيلة', 120.00, 'cat_1')
ON CONFLICT (id) DO NOTHING; -- التصحيح: ON CONFLICT مرة واحدة في النهاية (استخدام ID كهدف)

-- *******************************************************************
-- 5. تفعيل RLS وإنشاء السياسات (Policies)
-- *******************************************************************

-- حذف السياسات الموجودة (لضمان عملية نظيفة)
DROP POLICY IF EXISTS "Allow read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow read access to products" ON products;
DROP POLICY IF EXISTS "Allow read access to customer_codes" ON customer_codes;
DROP POLICY IF EXISTS "Allow read access to bookings" ON bookings;
DROP POLICY IF EXISTS "Allow read access to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow insert to bookings" ON bookings;
DROP POLICY IF EXISTS "Allow insert to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow update to bookings" ON bookings;
DROP POLICY IF EXISTS "Allow update to chat_messages" ON chat_messages;

-- إنشاء سياسات RLS
CREATE POLICY "Allow read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow read access to customer_codes" ON customer_codes FOR SELECT USING (true);
CREATE POLICY "Allow read access to bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow read access to chat_messages" ON chat_messages FOR SELECT USING (true);

-- إنشاء سياسات للكتابة
CREATE POLICY "Allow insert to bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Allow update to chat_messages" ON chat_messages FOR UPDATE USING (true);