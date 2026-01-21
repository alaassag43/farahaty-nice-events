
import { Product, Package, AppContent } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'كوشة ملكية فاخرة',
    description: 'كوشة بتصميم عصري مع إضاءة خافتة وأزهار طبيعية تناسب القاعات الكبيرة.',
    price: 1500,
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'],
    category_id: 'cat_1', // Use database category id
    is_available: true,
    stock: 2,
    specifications: {
      size: '5m x 3m',
      includesInstallation: true,
      accessories: ['إضاءة ليد', 'ستائر حريرية', 'أرائك']
    }
  },
  {
    id: '2',
    name: 'نظام صوتي متكامل',
    description: 'مكبرات صوت احترافية مع ميكروفونات لاسلكية وموزع صوت.',
    price: 500,
    images: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'],
    category_id: 'cat_2',
    is_available: true,
    stock: 10,
    specifications: {
      size: 'N/A',
      includesInstallation: true,
      accessories: ['2 مكبر صوت', 'جهاز ميكسر', 'ميكروفون لاسلكي']
    }
  },
  {
    id: '3',
    name: 'كرسي فندقي ذهبي',
    description: 'كراسي فندقية فخمة باللون الذهبي مناسبة للقاعات.',
    price: 15,
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'],
    category_id: 'cat_3',
    is_available: true,
    stock: 500,
    specifications: {
      size: 'Standard',
      includesInstallation: false,
      accessories: []
    }
  }
];

export const INITIAL_PACKAGES: Package[] = [
  {
    id: 'p1',
    name: 'الباقة الفضية',
    description: 'مثالية للمناسبات الصغيرة والمتوسطة.',
    price: 2000,
    items: ['كوشة بسيطة', 'سماعة واحدة كبير', 'إضاءة ثابتة'],
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800',
    tier: 'Silver'
  }
];

export const INITIAL_CONTENT: AppContent = {
  admin_password: 'ADMIN123',
  main_welcome_message: 'مرحباً بك في تطبيق فرحتي لتنسيق المناسبات',
  whatsapp_link: 'https://wa.me/'
};
