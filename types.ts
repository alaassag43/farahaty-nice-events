export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export interface Section {
  id: string;
  name: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  sections: Section[];
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  customer_code_id: string | null;
  sender_type: 'customer' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CustomerCode {
  id: string;
  code: string;
  customer_name: string;
  user_phone?: string;
  created_at: string;
  is_active: boolean;
  status: 'pending' | 'approved' | 'rejected';
  wallet_balance: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'refund' | 'payment' | 'credit' | 'coupon';
  description: string;
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
  payment_method?: string;
}

export interface Review {
  id: string;
  userId: string;
  productId?: string;
  bookingId?: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validUntil: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data?: any;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId?: string;
  data?: any;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  category_id: string;
  is_available: boolean;
  stock: number;
  specifications: any; // JSONB in database
  created_at?: string;
  updated_at?: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  items: string[];
  image: string;
  tier: string;
}

export interface Booking {
  id: string;
  user_id: string;
  user_name: string;
  user_phone?: string;
  start_date: string;
  end_date: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Delivered';
  total_price: number;
  location: string;
  created_at: string;
  items: any; // JSONB in database
  deposit_amount: number;
}

export interface AppContent {
  id?: string;
  admin_password?: string;
  main_welcome_message?: string;
  whatsapp_link?: string;
  maintenance_mode?: boolean;
  analytics_enabled?: boolean;
  notifications_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AppSettings extends AppContent {
  // Extended interface for app settings
}

// Dashboard Statistics Interface
export interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  pendingCodes: number;
  lowStockProducts: number;
  recentTransactions: Transaction[];
  monthlyRevenue: { month: string; revenue: number }[];
}

// Filter and Search Interfaces
export interface ProductFilters {
  category?: string;
  priceRange?: { min: number; max: number };
  availability?: boolean;
  search?: string;
}

export interface BookingFilters {
  status?: string;
  dateRange?: { start: string; end: string };
  customer?: string;
}

export interface CustomerFilters {
  status?: string;
  hasBookings?: boolean;
  search?: string;
}

// Form Data Interfaces
export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  images: string[];
  categoryId: string;
  stock: number;
  specifications: Record<string, any>;
}

export interface CreateBookingData {
  userId: string;
  userName: string;
  userPhone?: string;
  startDate: string;
  endDate: string;
  location: string;
  items: any[];
  depositAmount: number;
  couponCode?: string;
}

export interface CreateCustomerData {
  customerName: string;
  userPhone?: string;
  initialBalance?: number;
}

export interface CreateCouponData {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validUntil: string;
  usageLimit?: number;
}

// API Response Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Real-time Subscription Types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T = any> {
  eventType: RealtimeEvent;
  new: T | null;
  old: T | null;
  table: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  error: string;
  success: string;
  warning: string;
}
