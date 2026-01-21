import { supabase } from './supabase';

export interface ReviewData {
  id?: string;
  userId: string;
  productId?: string;
  bookingId?: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ReviewService {
  static async createReview(data: Omit<ReviewData, 'id' | 'isVerified' | 'created_at' | 'updated_at'>): Promise<ReviewData | null> {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .insert([{
          ...data,
          isVerified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return review;
    } catch (error) {
      console.error('Failed to create review:', error);
      throw error;
    }
  }

  static async getProductReviews(productId: string): Promise<ReviewData[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('productId', productId)
        .eq('isVerified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get product reviews:', error);
      return [];
    }
  }

  static async getBookingReviews(bookingId: string): Promise<ReviewData[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('bookingId', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get booking reviews:', error);
      return [];
    }
  }

  static async getUserReviews(userId: string): Promise<ReviewData[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('userId', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user reviews:', error);
      return [];
    }
  }

  static async getPendingReviews(): Promise<ReviewData[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('isVerified', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get pending reviews:', error);
      return [];
    }
  }

  static async verifyReview(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          isVerified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to verify review:', error);
      throw error;
    }
  }

  static async updateReview(id: string, updates: Partial<Pick<ReviewData, 'rating' | 'comment'>>): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update review:', error);
      throw error;
    }
  }

  static async deleteReview(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete review:', error);
      throw error;
    }
  }

  static calculateAverageRating(reviews: ReviewData[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  static getRatingDistribution(reviews: ReviewData[]): Record<number, number> {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });
    return distribution;
  }

  static async canUserReview(userId: string, productId?: string, bookingId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('reviews')
        .select('id')
        .eq('userId', userId);

      if (productId) {
        query = query.eq('productId', productId);
      }

      if (bookingId) {
        query = query.eq('bookingId', bookingId);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;
      return !data; // Can review if no existing review found
    } catch (error) {
      console.error('Failed to check if user can review:', error);
      return false;
    }
  }
}
