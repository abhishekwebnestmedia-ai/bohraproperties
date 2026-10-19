# Frontend Socket.IO Integration Guide

This guide explains how to connect your frontend to the backend WebSocket, **how rooms work**, and how to show real-time notifications.

---

## How Rooms Work (Backend → You Don’t Join Manually)

**You do not join rooms from the frontend.** The server puts your socket into the right rooms when you connect using your JWT.

1. **You connect** with `auth: { token: jwt }`.
2. **Server** reads the JWT, gets `userId` and `role`.
3. **Server** runs:
   - `socket.join(socket.userId)` → your **personal room** (e.g. `"507f1f77bcf86cd799439011"`).
   - If role is `admin` or `superadmin` → `socket.join("admins")`.
   - If role is `teamlead` → `socket.join("teamlead:" + userId)`.
4. **Backend sends notifications** by emitting to those room names, e.g. `io.to(userId).emit("notification:new", data)`.

So:

- **Employee:** only in room `userId` → gets events sent to their ID.
- **Teamlead:** in `userId` + `teamlead:userId` → gets events sent to their ID (and any future teamlead-specific events).
- **Admin / Superadmin:** in `userId` + `"admins"` → get events sent to their ID **and** events sent to the `"admins"` room (e.g. all lead reminders).

**Frontend step:** connect with the token; the server handles rooms. You only need to **listen** to the events below.

---

## Step 1: Install dependency

```bash
npm install socket.io-client
```

---

## Step 2: Connect with JWT (and where to get the token)

Socket must send the same JWT you use for REST APIs (e.g. login response or `localStorage`).

```js
import { io } from 'socket.io-client';

const token = localStorage.getItem('auth_token'); // or from your auth context

const socket = io('http://localhost:4000', {
  auth: {
    token,
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

- If the token is missing or invalid, the server will reject the connection (you’ll get an error / disconnect).
- Use the **same** API base URL as your app (e.g. `process.env.REACT_APP_API_URL` or your config).

---

## Step 3: Confirm connection and “rooms”

After a successful connection, the server emits once to **you**:

```js
socket.on('connected', (data) => {
  // data = { message: "Connected to CRM", userId, role }
  console.log('Connected', data.userId, data.role);
});
```

You are now in the correct server-side rooms; no extra join from the client is needed.

---

## Step 4: Listen to notification events

These are the events the backend sends. Listen on the **same** `socket` instance you created above.

| Event                 | When it fires                         | Typical use |
|-----------------------|----------------------------------------|-------------|
| `notification:new`    | A notification was created for you     | Add to list, show toast, badge |
| `lead:followup-set`    | Follow-up date set/updated on a lead  | Refresh leads or show message |
| `reminder:triggered`   | Follow-up/due time reached (cron)     | Show “Reminder: …” |
| `task:due-soon`       | Task note due date reached            | Show task reminder |
| `lead:status-changed` | Lead status updated                   | Refresh lead list |
| `lead:transferred`     | Lead transferred to you                | Refresh “My leads” |

Example:

```js
socket.on('notification:new', (payload) => {
  // payload: { id, title, message, type, refId, createdAt }
  setNotifications(prev => [{ ...payload, read: false }, ...prev]);
  showToast(payload.title);
});

socket.on('reminder:triggered', (payload) => {
  // payload: { leadId, clientName, type, message }
  showToast(`Reminder: ${payload.message}`);
});

socket.on('task:due-soon', (payload) => {
  // payload: { taskId, title, dueDate }
  showToast(`Task due: ${payload.title}`);
});
```

You can feed the same data into your notification API (e.g. refetch list or append to state so the notification list and “notification API” stay in sync).

---

## Step 5: Optional – Heartbeat

To keep the connection alive through proxies/firewalls:

```js
setInterval(() => {
  if (socket.connected) socket.emit('ping');
}, 30000);
```

Server replies with `pong`; you can listen with `socket.on('pong', () => {})` if needed.

---

## Step 6: Disconnect on logout

When the user logs out, disconnect and (if you want) clear the token before that:

```js
socket.disconnect();
// e.g. localStorage.removeItem('auth_token');
```

Reconnect only after a new login (new token).

---

## Flow summary

1. User logs in → you store JWT (e.g. in `localStorage` or context).
2. You create `io(API_URL, { auth: { token } })` (e.g. inside a React context/provider).
3. Server validates JWT and **joins your socket to** `userId` (and optionally `admins` / `teamlead:userId`).
4. Backend emits to `userId` or `admins` → you receive on the same socket.
5. You listen to `notification:new`, `reminder:triggered`, `task:due-soon`, etc., and update UI / notification list.
6. Your **notification API** (e.g. `GET /api/notifications`) returns what’s in the DB; superadmin/admin get all, others get their own. Real-time layer = Socket; list/badge = API + socket updates.

---

## Quick checklist

- [ ] Install `socket.io-client`.
- [ ] Connect with `auth: { token }` (same JWT as REST).
- [ ] Listen to `connected` to confirm and get `userId`/`role`.
- [ ] Listen to `notification:new`, `reminder:triggered`, `task:due-soon` (and others you need).
- [ ] Update state or refetch notifications when events arrive.
- [ ] Disconnect on logout; reconnect only after new login.

You do **not** need to emit “join” or “leave” for rooms; the server handles that when you connect with the token.

---

## Optional: React provider (ready-to-use)

See **frontend-examples/SocketProvider.jsx**. Copy it into your React app (e.g. `src/context/SocketProvider.jsx`). Wrap your app with `<SocketProvider>`, then use `useSocket()` and `useNotifications()` in any component. On logout call `disconnectSocket()` before clearing the token.

---

## Syncing with the Notification API

- **GET /api/notifications** returns the list from the DB (admin/superadmin see all; others see their own).
- When you receive `notification:new`, add to local state and/or refetch GET /api/notifications when the user opens the notifications page.
- For mark-as-read: use **PATCH /api/notifications/:id/read** and call `markNotificationRead(id)` in the provider so the UI updates.
