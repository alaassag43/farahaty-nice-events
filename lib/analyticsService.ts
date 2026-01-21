import { supabase } from './supabase';

export interface AnalyticsEventData {
  id?: string;
  eventType: string;
  userId?: string;
  data?: any;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  created_at?: string;
}

export class AnalyticsService {
  private static sessionId: string = this.generateSessionId();

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async trackEvent(eventType: string, data?: any, userId?: string): Promise<void> {
    try {
      const eventData: Omit<AnalyticsEventData, 'id' | 'created_at'> = {
        eventType,
        userId,
        data,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        // Note: IP address would typically be captured server-side
      };

      await supabase
        .from('analytics_events')
        .insert([eventData]);

      console.log(`Analytics event tracked: ${eventType}`);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Don't throw error to avoid breaking user experience
    }
  }

  static async trackPageView(page: string, userId?: string): Promise<void> {
    await this.trackEvent('page_view', { page, timestamp: new Date().toISOString() }, userId);
  }

  static async trackUserAction(action: string, details?: any, userId?: string): Promise<void> {
    await this.trackEvent('user_action', { action, details, timestamp: new Date().toISOString() }, userId);
  }

  static async trackBookingEvent(eventType: 'view' | 'start' | 'complete' | 'cancel', bookingId: string, userId?: string): Promise<void> {
    await this.trackEvent('booking_event', { eventType, bookingId, timestamp: new Date().toISOString() }, userId);
  }

  static async trackProductView(productId: string, userId?: string): Promise<void> {
    await this.trackEvent('product_view', { productId, timestamp: new Date().toISOString() }, userId);
  }

  static async trackSearch(query: string, resultsCount: number, userId?: string): Promise<void> {
    await this.trackEvent('search', { query, resultsCount, timestamp: new Date().toISOString() }, userId);
  }

  static async getAnalyticsSummary(startDate?: string, endDate?: string): Promise<any> {
    try {
      let query = supabase
        .from('analytics_events')
        .select('*');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process analytics data
      const summary = {
        totalEvents: data?.length || 0,
        eventsByType: {} as Record<string, number>,
        pageViews: 0,
        userActions: 0,
        uniqueUsers: new Set(),
        topPages: {} as Record<string, number>,
        topActions: {} as Record<string, number>,
      };

      data?.forEach((event: AnalyticsEventData) => {
        // Count events by type
        summary.eventsByType[event.eventType] = (summary.eventsByType[event.eventType] || 0) + 1;

        // Track unique users
        if (event.userId) {
          summary.uniqueUsers.add(event.userId);
        }

        // Count specific event types
        if (event.eventType === 'page_view') {
          summary.pageViews++;
          if (event.data?.page) {
            summary.topPages[event.data.page] = (summary.topPages[event.data.page] || 0) + 1;
          }
        }

        if (event.eventType === 'user_action') {
          summary.userActions++;
          if (event.data?.action) {
            summary.topActions[event.data.action] = (summary.topActions[event.data.action] || 0) + 1;
          }
        }
      });

      (summary.uniqueUsers as any) = summary.uniqueUsers.size;

      return summary;
    } catch (error) {
      console.error('Failed to get analytics summary:', error);
      return null;
    }
  }

  static async getRealtimeAnalytics(): Promise<any> {
    try {
      // Get events from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        recentEvents: data?.slice(0, 50) || [], // Last 50 events
        hourlyStats: this.calculateHourlyStats(data || []),
      };
    } catch (error) {
      console.error('Failed to get realtime analytics:', error);
      return null;
    }
  }

  private static calculateHourlyStats(events: AnalyticsEventData[]): any {
    const hourlyStats: Record<string, { events: number; users: Set<string> }> = {};

    events.forEach(event => {
      const hour = new Date(event.created_at!).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;

      if (!hourlyStats[hourKey]) {
        hourlyStats[hourKey] = { events: 0, users: new Set() };
      }

      hourlyStats[hourKey].events++;
      if (event.userId) {
        hourlyStats[hourKey].users.add(event.userId);
      }
    });

    // Convert Sets to counts
    const result: Record<string, { events: number; users: number }> = {};
    Object.keys(hourlyStats).forEach(hour => {
      result[hour] = {
        events: hourlyStats[hour].events,
        users: hourlyStats[hour].users.size,
      };
    });

    return result;
  }
}
