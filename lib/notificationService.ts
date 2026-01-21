import { supabase } from './supabase';

export interface NotificationData {
  id?: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data?: any;
  created_at?: string;
}

export class NotificationService {
  static async createNotification(notification: Omit<NotificationData, 'id' | 'isRead' | 'created_at'>): Promise<NotificationData | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notification,
          isRead: false,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string, limit: number = 50): Promise<NotificationData[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`userId.eq.${userId},userId.is.null`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  static async getUnreadNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`userId.eq.${userId},userId.is.null`)
        .eq('isRead', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get unread notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('isRead', false)
        .or(`userId.eq.${userId},userId.is.null`);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  static async createSystemNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> {
    await this.createNotification({
      title,
      message,
      type,
      userId: undefined, // System notification for all users
    });
  }

  static async notifyBookingStatus(bookingId: string, status: string, userId: string): Promise<void> {
    const statusMessages = {
      'Pending': { title: 'تم استلام طلبك', message: 'طلب الحجز الخاص بك قيد المراجعة', type: 'info' as const },
      'Confirmed': { title: 'تم تأكيد الحجز', message: 'تم تأكيد طلب الحجز الخاص بك بنجاح', type: 'success' as const },
      'Completed': { title: 'تم إتمام الحجز', message: 'تم إتمام طلب الحجز الخاص بك بنجاح', type: 'success' as const },
      'Cancelled': { title: 'تم إلغاء الحجز', message: 'تم إلغاء طلب الحجز الخاص بك', type: 'warning' as const },
    };

    const notification = statusMessages[status as keyof typeof statusMessages];
    if (notification) {
      await this.createNotification({
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: { bookingId, status },
      });
    }
  }

  static async notifyNewReview(productId: string, reviewId: string): Promise<void> {
    await this.createSystemNotification(
      'تقييم جديد',
      'تم إضافة تقييم جديد لأحد المنتجات',
      'info'
    );
  }

  static async notifyLowStock(productId: string, productName: string, stock: number): Promise<void> {
    await this.createSystemNotification(
      'تنبيه انخفاض المخزون',
      `المنتج "${productName}" أوشك على النفاد (المخزون المتبقي: ${stock})`,
      'warning'
    );
  }

  static async notifyCouponUsed(couponCode: string, userId: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'تم استخدام الكوبون',
      message: `تم استخدام كوبون الخصم "${couponCode}" بنجاح`,
      type: 'success',
      data: { couponCode },
    });
  }

  static async getNotificationStats(userId: string): Promise<{ total: number; unread: number }> {
    try {
      const [allNotifications, unreadNotifications] = await Promise.all([
        this.getUserNotifications(userId, 1000),
        this.getUnreadNotifications(userId),
      ]);

      return {
        total: allNotifications.length,
        unread: unreadNotifications.length,
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return { total: 0, unread: 0 };
    }
  }
}
