
import { Product, Package, AppContent } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'كوشة ملكية فاخرة',
    description: 'كوشة بتصميم عصري مع إضاءة خافتة وأزهار طبيعية تناسب القاعات الكبيرة.',
    price: 1500,
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'],
    // Fixed: changed category to categoryId and added required sectionId
    categoryId: 'كوشات',
    sectionId: '1',
    isAvailable: true,
    stock: 2,
    reviews: [
      // Fixed: added required id property to review
      { id: 'rev1', userId: 'u1', userName: 'أحمد صالح', rating: 5, comment: 'رائعة جداً وتنسيقها مذهل', date: '2024-03-10' }
    ],
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
    // Fixed: changed category to categoryId and added required sectionId
    categoryId: 'صوتيات',
    sectionId: '2',
    isAvailable: true,
    stock: 10,
    reviews: [],
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
    // Added required properties
    categoryId: 'أثاث',
    sectionId: '3',
    isAvailable: true,
    stock: 500,
    reviews: [],
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
  aboutUs: 'نحن متخصصون في تأجير أفخم مستلزمات الأعراس والمناسبات، نسعى دائماً لجعل ليلة العمر ذكرى لا تُنسى.',
  rentalPolicy: 'يتم دفع تأمين مسترد عند الحجز. يجب الحفاظ على سلامة القطع المستأجرة.',
  cancellationPolicy: 'العربون غير مسترد في حال الإلغاء قبل الموعد بـ 48 ساعة.',
  categories: ['كوشات', 'صوتيات', 'إضاءة', 'أثاث', 'أدوات مائدة'],
  codePrefix: 'NICE',
  gallery: [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800'
  ]
};
