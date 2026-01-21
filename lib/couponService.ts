import { supabase } from './supabase';

export interface CouponData {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validUntil: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  created_at?: string;
}

export class CouponService {
  static async createCoupon(data: Omit<CouponData, 'id' | 'usageCount' | 'created_at'>): Promise<CouponData | null> {
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .insert([{
          ...data,
          usageCount: 0,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return coupon;
    } catch (error) {
      console.error('Failed to create coupon:', error);
      throw error;
    }
  }

  static async getActiveCoupons(): Promise<CouponData[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('isActive', true)
        .gt('validUntil', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get active coupons:', error);
      return [];
    }
  }

  static async validateCoupon(code: string): Promise<CouponData | null> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('isActive', true)
        .gt('validUntil', now)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      // Check usage limit
      if (data.usageLimit && data.usageCount >= data.usageLimit) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to validate coupon:', error);
      return null;
    }
  }

  static async applyCoupon(code: string): Promise<void> {
    try {
      // First get the current coupon
      const coupon = await this.validateCoupon(code);
      if (!coupon) throw new Error('Invalid coupon');

      // Increment usage count
      const { error } = await supabase
        .from('coupons')
        .update({ usageCount: coupon.usageCount + 1 })
        .eq('id', coupon.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      throw error;
    }
  }

  static async updateCoupon(id: string, updates: Partial<CouponData>): Promise<void> {
    try {
      const { error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update coupon:', error);
      throw error;
    }
  }

  static async deleteCoupon(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      throw error;
    }
  }

  static calculateDiscount(coupon: CouponData, totalAmount: number): number {
    if (coupon.discountType === 'percentage') {
      return Math.min((totalAmount * coupon.discountValue) / 100, totalAmount);
    } else {
      return Math.min(coupon.discountValue, totalAmount);
    }
  }
}
