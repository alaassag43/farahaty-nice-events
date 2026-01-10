
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
  sections: Section[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface CustomerCode {
  id: string;
  code: string;
  customerName: string;
  userPhone?: string;
  createdAt: string;
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected';
  walletBalance: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'refund' | 'payment' | 'credit';
  description: string;
  created_at: string;
  status: 'completed' | 'pending';
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  sectionId: string;
  isAvailable: boolean;
  stock: number;
  reviews: Review[];
  specifications: {
    size: string;
    includesInstallation: boolean;
    accessories: string[];
  };
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
  userId: string;
  userName: string;
  userPhone: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Delivered';
  totalPrice: number;
  location: string;
  createdAt: string;
  items: { productId: string; quantity: number; name: string }[];
  depositAmount: number;
}

export interface AppContent {
  id?: string;
  aboutUs: string;
  rentalPolicy: string;
  cancellationPolicy: string;
  admin_password?: string;
  codePrefix: string;
  gallery: string[];
  categories?: string[];
}
