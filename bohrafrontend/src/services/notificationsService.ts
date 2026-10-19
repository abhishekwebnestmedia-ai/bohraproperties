import api from './api';

// This is intentionally permissive because backend payloads vary.
export type NotificationsListResponse = {
  success?: boolean;
  data?: any[];
  notifications?: any[];
};

const getNotificationsApiPath = () => {
  const fromEnv = import.meta.env.VITE_NOTIFICATIONS_API_PATH as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv;
  return '/notifications';
};

class NotificationsService {
  async list(): Promise<NotificationsListResponse> {
    const response = await api.get(getNotificationsApiPath());
    return response.data;
  }

  async markNotificationRead(id: string): Promise<{ success?: boolean; message?: string } | any> {
    const response = await api.patch(`${getNotificationsApiPath()}/${id}/read`);
    return response.data;
  }

  async markAllRead(): Promise<{ success?: boolean } | any> {
    const response = await api.patch(`${getNotificationsApiPath()}/read-all`);
    return response.data;
  }

  async deleteNotification(id: string): Promise<{ success?: boolean } | any> {
    const response = await api.delete(`${getNotificationsApiPath()}/${id}`);
    return response.data;
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
