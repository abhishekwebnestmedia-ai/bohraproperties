import { createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import authService from '../services/authService';
import { createAuthedSocket } from '../services/socketClient';
import notificationsService from '../services/notificationsService';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  event: string;
  payload?: unknown;
};

export type ReminderAlarm = {
  id: string;
  taskTitle: string;
  message: string;
  dueDate?: string;
  createdAt: string;
  payload?: unknown;
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  connected: boolean;
  lastError: string | null;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
  reminderAlarms: ReminderAlarm[];
  dismissAlarm: (id: string) => void;
};

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const MAX_NOTIFICATIONS = 50;

const safeString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const normalizeNotification = (event: string, payload: any): AppNotification => {
  const createdAt =
    safeString(payload?.createdAt) ||
    safeString(payload?.timestamp) ||
    new Date().toISOString();

  const id =
    safeString(payload?._id) ||
    safeString(payload?.id) ||
    `${event}:${createdAt}:${Math.random().toString(16).slice(2)}`;

  // Map lead-specific events to human-readable titles
  const eventTitles: Record<string, string> = {
    'lead:followup-set': 'Follow-up Scheduled',
    'lead:status-changed': 'Lead Status Changed',
    'lead:transferred': 'Lead Transferred',
    'lead:updated': 'Lead Updated',
    'task:due-soon': 'Task Due Soon',
  };

  const title =
    safeString(payload?.title) ||
    eventTitles[event] ||
    safeString(payload?.type) ||
    'Notification';

  const message =
    safeString(payload?.message) ||
    safeString(payload?.text) ||
    safeString(payload?.description) ||
    (event === 'lead:status-changed'
      ? `${safeString(payload?.clientName)}: ${safeString(payload?.oldStatus)} → ${safeString(payload?.newStatus)}`
      : event === 'lead:transferred'
        ? `Lead "${safeString(payload?.clientName)}" transferred`
        : event === 'lead:followup-set'
          ? `Follow-up for ${safeString(payload?.clientName)} on ${safeString(payload?.followUpDate)}`
          : 'You have a new notification.');

  // Respect `isRead` / `read` fields from backend payload
  const read = !!(payload?.isRead || payload?.read || false);

  return {
    id,
    title,
    message,
    createdAt,
    read,
    event,
    payload,
  };
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [reminderAlarms, setReminderAlarms] = useState<ReminderAlarm[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);
  // Track dismissed/read notification IDs to prevent re-alarming
  const dismissedIdsRef = useRef<Set<string>>(new Set());

  const pushNotification = useCallback((event: string, payload: any) => {
    const next = normalizeNotification(event, payload);
    setNotifications((prev) => {
      // Prevent duplicates by id
      if (prev.some((n) => n.id === next.id)) return prev;
      return [next, ...prev].slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  /**
   * Trigger the alarm overlay for reminder/task-due events.
   * Called separately from pushNotification so these events
   * don't double-add to the notification list.
   * Skips if the corresponding notification was already dismissed/read.
   */
  const triggerAlarm = useCallback((payload: any) => {
    const alarmId =
      safeString(payload?._id) ||
      safeString(payload?.id) ||
      `alarm:${Date.now()}:${Math.random().toString(16).slice(2)}`;

    // Skip alarm if the underlying notification has been dismissed/read
    const notifId = safeString(payload?._notificationId) || safeString(payload?._id) || safeString(payload?.id);
    if (notifId && dismissedIdsRef.current.has(notifId)) {
      return; // Already dismissed — don't re-alarm
    }

    const taskTitle =
      safeString(payload?.task?.title) ||
      safeString(payload?.taskTitle) ||
      safeString(payload?.clientName) ||
      safeString(payload?.title) ||
      'Task Reminder';

    const message =
      safeString(payload?.message) ||
      safeString(payload?.text) ||
      'A task is due now.';

    const dueDate =
      safeString(payload?.task?.dueDate) ||
      safeString(payload?.dueDate) ||
      safeString(payload?.createdAt) ||
      undefined;

    setReminderAlarms((prev) => {
      // Prevent duplicate alarm for same id
      if (prev.some((a) => a.id === alarmId)) return prev;
      return [
        { id: alarmId, taskTitle, message, dueDate, createdAt: new Date().toISOString(), payload },
        ...prev,
      ];
    });
  }, []);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.removeAllListeners();
    socket.disconnect();
    socketRef.current = null;
    tokenRef.current = null; // Reset so syncAuth reconnects on StrictMode remount
    setConnected(false);
    setLastError(null);
  }, []);

  const connect = useCallback(
    (token: string) => {
      // Reconnect only if token changed.
      if (socketRef.current) {
        disconnect();
      }

      const socket = createAuthedSocket({ token });
      socketRef.current = socket;

      const debug = import.meta.env.DEV || (import.meta.env.VITE_NOTIFICATIONS_DEBUG as string | undefined) === 'true';

      socket.on('connect', () => {
        if (debug) console.log('[notifications] socket connected, id:', socket.id);
        setConnected(true);
        setLastError(null);
      });
      socket.on('disconnect', (reason) => {
        if (debug) console.log('[notifications] socket disconnected, reason:', reason);
        setConnected(false);
      });
      socket.on('connect_error', (err: any) => {
        if (debug) console.error('[notifications] connect_error:', err?.message);
        setConnected(false);
        setLastError(err?.message ? String(err.message) : 'Socket connect error');
      });
      socket.on('error', (err: any) => {
        if (debug) console.error('[notifications] error:', err?.message);
        setLastError(err?.message ? String(err.message) : 'Socket error');
      });
 
      if (debug) {
        socket.onAny((event, ...args) => {
          // eslint-disable-next-line no-console
          console.log('[socket]', event, args?.[0]);
        });
      }

      // Listen for backend connection acknowledgment
      socket.on('connected', (data) => {
        if (debug) console.log('[notifications] backend ack:', data);
      });

      // Optional: seed notification list via HTTP if backend supports it.
      // Also trigger alarm overlays for any unread reminder/task-due notifications (missed reminders)
      notificationsService
        .list()
        .then((res) => {
          const list = (res.data ?? res.notifications ?? []) as any[];
          if (!Array.isArray(list) || list.length === 0) return;

          const mapped = list.map((p) => ({
            ...normalizeNotification('notifications:list', p),
            read: !!(p?.isRead || p?.read),
          }));

          setNotifications((prev) => {
            const seen = new Set(prev.map((n) => n.id));
            const merged = [...mapped.filter((n) => !seen.has(n.id)), ...prev];
            return merged.slice(0, MAX_NOTIFICATIONS);
          });

          // Populate dismissed set with already-read IDs so they won't trigger alarms
          mapped.filter((n) => n.read).forEach((n) => dismissedIdsRef.current.add(n.id));

          // Check for unread reminder/task-due notifications → trigger alarm for missed ones
          const alarmPatterns = /reminder|task due|follow.?up/i;
          const missedReminders = mapped.filter(
            (n) => !n.read && alarmPatterns.test(n.title)
          );
          if (missedReminders.length > 0) {
            missedReminders.forEach((n) => {
              triggerAlarm({
                id: `missed:${n.id}`,
                title: n.title,
                message: n.message,
                clientName: (n.payload as any)?.clientName,
                dueDate: (n.payload as any)?.dueDate || (n.payload as any)?.followUpDate,
                createdAt: n.createdAt,
                _notificationId: n.id,
              });
            });
          }
        })
        .catch(() => {
          // Silently ignore if endpoint doesn't exist.
        });

      // ── notification:new → the ONLY event that adds to the notification list ──
      socket.on('notification:new', (payload) => pushNotification('notification:new', payload));

      // ── Alarm events → trigger alarm overlay only (NOT added to list) ──
      // notification:new already added the list entry from the same backend call
      socket.on('reminder:triggered', (payload) => triggerAlarm(payload));
      socket.on('task:due-soon', (payload) => triggerAlarm(payload));

      // Compatibility fallbacks (no-op if server never emits these)
      socket.on('notification', (payload) => pushNotification('notification', payload));
      socket.on('notifications:new', (payload) => pushNotification('notifications:new', payload));
    },
    [disconnect, pushNotification, triggerAlarm]
  );

  useEffect(() => {
    const syncAuth = () => {
      const token = authService.getToken();
      // Reconnect if token changed OR if socket is dead (e.g., after StrictMode remount)
      if (token === tokenRef.current && socketRef.current?.connected) return;

      tokenRef.current = token;
      if (!token) {
        disconnect();
        setNotifications([]);
        return;
      }

      connect(token);
    };

    // Handle snoozed alarm re-trigger
    const handleSnoozedAlarm = (e: Event) => {
      const payload = (e as CustomEvent).detail;
      if (payload) {
        triggerAlarm(payload);
      }
    };

    // Initial sync
    syncAuth();

    // React to login/logout
    window.addEventListener('auth:changed', syncAuth);

    // React to multi-tab logout/login
    window.addEventListener('storage', syncAuth);

    // React to snoozed alarm re-triggers
    window.addEventListener('alarm:snoozed', handleSnoozedAlarm);

    return () => {
      window.removeEventListener('auth:changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('alarm:snoozed', handleSnoozedAlarm);
      disconnect();
    };
  }, [connect, disconnect, triggerAlarm]);

  const markRead = useCallback((id: string) => {
    // Optimistic UI + track as dismissed so it won't re-alarm
    dismissedIdsRef.current.add(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    notificationsService
      .markNotificationRead(id)
      .then(() => {
        // nothing else; optimistic already applied
      })
      .catch((err: any) => {
        // Rollback if backend rejects
        dismissedIdsRef.current.delete(id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
        setLastError(err?.message ? String(err.message) : 'Failed to mark notification read');
      });
  }, []);

  const markAllRead = useCallback(() => {
    // Track all current notification ids as dismissed
    setNotifications((prev) => {
      prev.forEach((n) => dismissedIdsRef.current.add(n.id));
      return prev.map((n) => ({ ...n, read: true }));
    });
    notificationsService.markAllRead().catch((err: any) => {
      setLastError(err?.message ? String(err.message) : 'Failed to mark all notifications read');
    });
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissAlarm = useCallback((id: string) => {
    // Find the alarm before removing it, so we can extract the notification id
    const alarm = reminderAlarms.find((a) => a.id === id);
    setReminderAlarms((prev) => prev.filter((a) => a.id !== id));

    // Extract the real notification id:
    // - missed alarms: id = "missed:<notificationId>"
    // - live alarms: the alarm payload may carry _notificationId, or the id itself is the notification id
    let notifId: string | null = null;
    if (id.startsWith('missed:')) {
      notifId = id.slice(7);
    } else {
      // Try _notificationId from alarm payload first, then fall back to alarm id
      const payloadNotifId = (alarm?.payload as any)?._notificationId || (alarm?.payload as any)?._id || (alarm?.payload as any)?.id;
      notifId = payloadNotifId ? String(payloadNotifId) : id;
    }

    if (notifId) {
      // Track as dismissed so it won't re-alarm
      dismissedIdsRef.current.add(notifId);
      // Mark notification as read locally + on backend so it won't re-alarm on refresh
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
      notificationsService.markNotificationRead(notifId).catch(() => {});
    }
  }, [reminderAlarms]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo<NotificationsContextValue>(
    () => ({ notifications, unreadCount, connected, lastError, markRead, markAllRead, clear, reminderAlarms, dismissAlarm }),
    [notifications, unreadCount, connected, lastError, markRead, markAllRead, clear, reminderAlarms, dismissAlarm]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};
