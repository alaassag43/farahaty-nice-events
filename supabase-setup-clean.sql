-- إعداد قاعدة البيانات النظيفة لتطبيق فرحتي - المناسبات
-- بدون بيانات تجريبية لتجنب المشاكل

-- تفعيل الامتدادات المطلوبة
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- حذف الجداول الموجودة إذا كانت موجودة
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS customer_codes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- إنشاء الجداول

-- جدول الفئات
CREATE TABLE categories (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المنتجات
CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  images JSONB DEFAULT '[]'::jsonb,
  category_id VARCHAR(255) REFERENCES categories(id) ON DELETE SET NULL,
  is_available BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 1,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول أكواد العملاء
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

-- جدول الحجوزات
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

-- جدول رسائل الدردشة
CREATE TABLE chat_messages (
  id VARCHAR(255) PRIMARY KEY,
  customer_code_id VARCHAR(255) REFERENCES customer_codes(id) ON DELETE CASCADE,
  sender_type TEXT DEFAULT 'customer' CHECK (sender_type IN ('customer', 'admin')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول إعدادات التطبيق
CREATE TABLE app_settings (
  id VARCHAR(255) PRIMARY KEY,
  admin_password TEXT DEFAULT 'ADMIN123',
  main_welcome_message TEXT DEFAULT 'مرحباً بك في تطبيق فرحتي لتنسيق المناسبات',
  whatsapp_link TEXT DEFAULT 'https://wa.me/',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج إعدادات التطبيق الأساسية فقط
INSERT INTO app_settings (id, admin_password, main_welcome_message, whatsapp_link) VALUES
('main_settings', 'ADMIN123', 'مرحباً بك في تطبيق فرحتي لتنسيق المناسبات', 'https://wa.me/')
ON CONFLICT (id) DO NOTHING;

-- تفعيل RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة إذا كانت موجودة
DROP POLICY IF EXISTS "Allow read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow read access to products" ON products;
DROP POLICY IF EXISTS "Allow read access to customer_codes" ON customer_codes;
DROP POLICY IF EXISTS "Allow read access to bookings" ON bookings;
DROP POLICY IF EXISTS "Allow read access to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow read access to app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow insert to bookings" ON bookings;
DROP POLICY IF EXISTS "Allow insert to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow insert to customer_codes" ON customer_codes;
DROP POLICY IF EXISTS "Allow update to bookings" ON bookings;
DROP POLICY IF EXISTS "Allow update to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow update to customer_codes" ON customer_codes;
DROP POLICY IF EXISTS "Allow update to app_settings" ON app_settings;

-- إنشاء سياسات RLS للقراءة
CREATE POLICY "Allow read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow read access to customer_codes" ON customer_codes FOR SELECT USING (true);
CREATE POLICY "Allow read access to bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow read access to chat_messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow read access to app_settings" ON app_settings FOR SELECT USING (true);

-- إنشاء سياسات للكتابة
CREATE POLICY "Allow insert to bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to customer_codes" ON customer_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Allow update to chat_messages" ON chat_messages FOR UPDATE USING (true);
CREATE POLICY "Allow update to customer_codes" ON customer_codes FOR UPDATE USING (true);
CREATE POLICY "Allow update to app_settings" ON app_settings FOR UPDATE USING (true);
