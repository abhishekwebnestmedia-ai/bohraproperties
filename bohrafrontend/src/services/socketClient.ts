import { io, type Socket } from 'socket.io-client';

export type SocketAuth = { token: string };

export const getSocketBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv;

  // Derive from API base URL so socket and API always point to the same server
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;
  if (apiBase && apiBase.trim()) {
    // Strip trailing /api path if present
    return apiBase.replace(/\/api\/?$/, '');
  }

  // Fallback: localhost for development, production URL otherwise
  if (import.meta.env.DEV) return 'http://localhost:4000';
  return 'https://darkorchid-kudu-454380.hostingersite.com';
};

export const getSocketPath = () => {
  const fromEnv = import.meta.env.VITE_SOCKET_PATH as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv;
  return '/socket.io';
};

export const createAuthedSocket = (auth: SocketAuth): Socket => {
  return io(getSocketBaseUrl(), {
    // Allow polling fallback in case WS is blocked by proxies.
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    auth,
    // Some backends read token from query instead of handshake.auth
    query: { token: auth.token },
    // Some deployments mount socket.io under /api
    path: getSocketPath(),
    timeout: 20000,
  });
};
