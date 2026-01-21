import { dbOperation } from './firebase';

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
      const newNotification: NotificationData = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isRead: false,
        created_at: new Date().toISOString(),
      };

      await dbOperation('set', 'notifications', newNotification, newNotification.id);
      return newNotification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string, limit: number = 50): Promise<NotificationData[]> {
    try {
      const allNotifications = await dbOperation('get', 'notifications') as NotificationData[];
      const userNotifications = allNotifications
        .filter(notification => !notification.userId || notification.userId === userId)
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, limit);

      return userNotifications;
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  static async getUnreadNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const allNotifications = await dbOperation('get', 'notifications') as NotificationData[];
      const unreadNotifications = allNotifications
        .filter(notification => (!notification.userId || notification.userId === userId) && !notification.isRead)
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

      return unreadNotifications;
    } catch (error) {
      console.error('Failed to get unread notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await dbOperation('update', 'notifications', { isRead: true }, notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const allNotifications = await dbOperation('get', 'notifications') as NotificationData[];
      const unreadUserNotifications = allNotifications.filter(
        notification => (!notification.userId || notification.userId === userId) && !notification.isRead
      );

      // Update each notification individually
      for (const notification of unreadUserNotifications) {
        await dbOperation('update', 'notifications', { isRead: true }, notification.id);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await dbOperation('delete', 'notifications', null, notificationId);
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

  static async notifyCodeApproval(userId: string, code: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'تم تفعيل الكود بنجاح',
      message: `تم تفعيل الكود الخاص بك بنجاح! كود الدخول: ${code}`,
      type: 'success',
      data: { code },
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
