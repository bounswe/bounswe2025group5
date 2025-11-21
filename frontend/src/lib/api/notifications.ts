import { ApiClient } from './client';
import {
  NotificationSchema,
  type Notification,
  MarkAsReadResponseSchema,
  type MarkAsReadResponse,
} from './schemas/notifications';

export const NotificationsApi = {
  /**
   * Get all notifications for a user
   */
  list: async (username: string) => {
    const data = await ApiClient.get<Notification[]>(`/api/notifications/${username}`);
    data.forEach(item => NotificationSchema.parse(item));
    return data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: number) => {
    const data = await ApiClient.post<MarkAsReadResponse>(`/api/notifications/read/${id}`);
    return MarkAsReadResponseSchema.parse(data);
  },
};
