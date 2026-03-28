import { io } from 'socket.io-client';

/**
 * Singleton Socket.IO client instance.
 *
 * - In dev: Vite proxies /socket.io → backend (same-origin)
 * - In prod: connects directly to VITE_API_URL
 *
 * The socket does NOT auto-connect on import.
 * Call connectSocket(token) before joining a room.
 */

const SOCKET_URL = import.meta.env.DEV
  ? window.location.origin          // Vite proxy handles /socket.io upgrade
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

let socket = null;

/**
 * Initialize and connect the socket with a JWT token.
 * Safe to call multiple times — returns existing socket if already connected.
 *
 * @param {string} token  JWT from localStorage (buyerToken or sellerToken)
 * @returns {import('socket.io-client').Socket}
 */
export function connectSocket(token) {
  if (socket && socket.connected) return socket;

  // If socket exists but disconnected, update auth and reconnect
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },           // Passed to server's io.use() middleware
    autoConnect: true,
    transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected — id:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
}

/**
 * Disconnect and destroy the socket.
 * Call on logout.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance (may be null if not yet connected).
 */
export function getSocket() {
  return socket;
}
