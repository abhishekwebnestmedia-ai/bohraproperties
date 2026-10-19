/**
 * Socket.io Connection Setup for Frontend (React)
 * 
 * Install: npm install socket.io-client
 */

import io from 'socket.io-client';

// Get JWT token from localStorage or auth context
const getToken = () => {
  return localStorage.getItem('auth_token'); // Adjust based on your setup
};

/**
 * Initialize Socket Connection
 * Call this in useEffect after user logs in
 */
export function initializeSocket() {
  const token = getToken();
  
  if (!token) {
    console.warn('No token available for socket connection');
    return null;
  }

  const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
    auth: {
      token, // Sends JWT token for authentication
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Connected event
  socket.on('connected', (data) => {
    console.log('✅ Connected to CRM:', data);
  });

  // Disconnect event
  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected:', reason);
  });

  // Error event
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  return socket;
}

/**
 * Listen to notification events
 */
export function setupNotificationListeners(socket) {
  if (!socket) return;

  // New notification
  socket.on('notification:new', (notification) => {
    console.log('🔔 New notification:', notification);
    // Update your notification state here
    // dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  });

  // Lead followup set
  socket.on('lead:followup-set', (data) => {
    console.log('📅 Lead followup set:', data);
    // Refresh lead or show alert
  });

  // Lead status changed
  socket.on('lead:status-changed', (data) => {
    console.log('🔄 Lead status changed:', data);
    // Update lead status in UI
  });

  // Lead transferred
  socket.on('lead:transferred', (data) => {
    console.log('📤 Lead transferred to you:', data);
    // Show alert or add to assigned leads
  });

  // Lead updated
  socket.on('lead:updated', (data) => {
    console.log('✏️ Lead updated:', data);
  });

  // Reminder triggered
  socket.on('reminder:triggered', (data) => {
    console.log('⏰ Reminder triggered:', data);
  });

  // Task due soon
  socket.on('task:due-soon', (data) => {
    console.log('📋 Task due soon:', data);
  });

  // Pong response (heartbeat)
  socket.on('pong', (data) => {
    console.log('💓 Heartbeat:', data);
  });
}

/**
 * Send heartbeat to keep connection alive
 */
export function startHeartbeat(socket, interval = 30000) {
  if (!socket) return;

  setInterval(() => {
    socket.emit('ping');
  }, interval);
}

/**
 * Usage in React Component:
 * 
 * import { useEffect, useRef } from 'react';
 * import { initializeSocket, setupNotificationListeners, startHeartbeat } from '@/utils/socketService';
 * 
 * function App() {
 *   const socketRef = useRef(null);
 * 
 *   useEffect(() => {
 *     const socket = initializeSocket();
 *     if (socket) {
 *       socketRef.current = socket;
 *       setupNotificationListeners(socket);
 *       startHeartbeat(socket);
 *     }
 * 
 *     return () => {
 *       if (socketRef.current) {
 *         socketRef.current.disconnect();
 *       }
 *     };
 *   }, []);
 * 
 *   return <div>Your App</div>;
 * }
 */

/**
 * Notification Context Example (Optional)
 */

import React, { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export function NotificationProvider({ children, socket }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [{
      id: notification.id,
      ...notification,
      timestamp: new Date(),
      read: false,
    }, ...prev]);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Listen to socket events
  React.useEffect(() => {
    if (socket) {
      socket.on('notification:new', addNotification);

      return () => {
        socket.off('notification:new', addNotification);
      };
    }
  }, [socket, addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use notifications
 */
export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
