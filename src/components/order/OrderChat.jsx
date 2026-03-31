import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { connectSocket, getSocket } from '../../lib/socket';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a timestamp for display.
 * Recent: "2 min ago" / "Just now"
 * Older: "Mar 28, 9:30 AM"
 */
function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrderChat — real-time per-order chat between buyer and seller.
 *
 * Props:
 *   orderId      {string}  The order UUID
 *   currentUser  {object}  { userId, role, firstName, lastName }
 *   orderStatus  {string}  Current order status
 *   inline       {boolean} If true, renders as embedded panel (inside OrderCard).
 *                          If false/undefined, renders as fixed floating bubble.
 */
const OrderChat = ({ orderId, currentUser, orderStatus, inline = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ── Determine if chat should be shown ────────────────────────────────────
  const CHAT_ELIGIBLE_STATUSES = [
    'ESCROW_FUNDED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'DISPUTED'
  ];
  const isEligible = CHAT_ELIGIBLE_STATUSES.includes(orderStatus);

  // ── Fetch initial messages via REST ──────────────────────────────────────
  const fetchMessages = useCallback(async (pageNum = 1, append = false) => {
    try {
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');
      const [roomRes, msgRes] = await Promise.all([
        axios.get(`/api/chat/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/chat/${orderId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: pageNum, limit: 30 },
        }),
      ]);

      if (roomRes.data.success) {
        const room = roomRes.data.data;
        setChatRoom(room);
        const expired = room.isArchived || !room.isActive ||
          (room.expiresAt && new Date(room.expiresAt) < new Date());
        setIsExpired(expired);
      }

      if (msgRes.data.success) {
        const { data, meta } = msgRes.data;
        setMessages(prev => append ? [...data, ...prev] : data);
        setHasMore(meta.page < meta.totalPages);
      }
    } catch (err) {
      console.error('[OrderChat] fetchMessages error:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId || !currentUser) return;

    const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');
    if (!token) return;

    // Fetch initial data (room + messages)
    fetchMessages(1);

    // Connect socket and join room
    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.emit('join_order_room', { orderId });

    // ── Incoming message ──────────────────────────────────────────────────
    const onReceive = (msg) => {
      setMessages(prev => {
        // Avoid duplicate if server echoes back our own sent message
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Track unread if chat panel is closed
      if (!isOpen && msg.senderId !== currentUser.userId) {
        setUnreadCount(c => c + 1);
      }
      // Mark as read if chat is open
      if (isOpen) {
        socket.emit('mark_read', { orderId });
      }
    };

    // ── Typing indicators ─────────────────────────────────────────────────
    const onTyping = ({ name, role }) => {
      setTypingUser(`${name} is typing…`);
    };
    const onStopTyping = () => setTypingUser(null);

    // ── Read receipts ─────────────────────────────────────────────────────
    const onRead = () => {
      setMessages(prev => prev.map(m =>
        m.senderId === currentUser.userId ? { ...m, isRead: true } : m
      ));
    };

    // ── Room join confirmation ────────────────────────────────────────────
    const onRoomJoined = ({ expiresAt, isActive }) => {
      if (!isActive || (expiresAt && new Date(expiresAt) < new Date())) {
        setIsExpired(true);
      }
    };

    const onChatError = ({ message }) => {
      console.warn('[OrderChat] Socket error:', message);
    };

    socket.on('receive_message', onReceive);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);
    socket.on('messages_read', onRead);
    socket.on('room_joined', onRoomJoined);
    socket.on('chat_error', onChatError);

    return () => {
      socket.off('receive_message', onReceive);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
      socket.off('messages_read', onRead);
      socket.off('room_joined', onRoomJoined);
      socket.off('chat_error', onChatError);
    };
  }, [orderId, currentUser, fetchMessages]);

  // ── Auto-scroll to bottom on new messages ────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // ── Clear unread count when chat opens ───────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      const socket = getSocket();
      if (socket) socket.emit('mark_read', { orderId });
    }
  }, [isOpen, orderId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || isExpired) return;

    setSending(true);
    setInput('');

    const socket = getSocket();
    if (socket && socket.connected) {
      // Prefer WebSocket
      socket.emit('send_message', { orderId, content: trimmed });
    } else {
      // HTTP fallback
      try {
        const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');
        const res = await axios.post(`/api/chat/${orderId}/message`,
          { content: trimmed },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setMessages(prev => [...prev, res.data.data]);
        }
      } catch (err) {
        console.error('[OrderChat] HTTP fallback send error:', err);
        setInput(trimmed); // Restore on failure
      }
    }

    setSending(false);
    inputRef.current?.focus();
  }, [input, sending, isExpired, orderId]);

  // ── Typing indicator emit ─────────────────────────────────────────────────
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing', { orderId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { orderId });
    }, 1500);
  }, [orderId]);

  // ── Load older messages ───────────────────────────────────────────────────
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(nextPage, true);
    setLoadingMore(false);
  };

  // ── Keyboard send ─────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Do not render for ineligible statuses (floating mode only) ──────────
  if (!inline && !isEligible) return null;

  // ─── Floating collapsed pill (non-inline only) ────────────────────────────
  if (!inline && !isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl font-inter font-semibold text-sm transition-all duration-200 hover:scale-105"
        >
          <span className="text-base">💬</span>
          Order Chat
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  // ─── Chat panel (inline = embedded in card, else floating fixed) ──────────
  const panelClass = inline
    ? 'flex flex-col bg-white overflow-hidden'
    : 'fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden';
  const panelStyle = inline ? { height: '400px' } : { height: '520px' };

  return (
    <div className={panelClass} style={panelStyle}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <div>
            <p className="text-white font-semibold text-sm font-inter">Order Chat</p>
            <p className="text-indigo-200 text-xs font-inter truncate max-w-[200px]">
              #{orderId.slice(0, 8)}…
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpired && (
            <span className="px-2 py-0.5 bg-orange-400 text-white text-xs rounded-full font-inter">
              Archived
            </span>
          )}
          {/* Connected indicator */}
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${getSocket()?.connected ? 'bg-green-400' : 'bg-neutral-400'}`} />
          </div>
          {!inline && (
            <button
              onClick={() => setIsOpen(false)}
              className="text-indigo-200 hover:text-white transition-colors p-1 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Expired banner ────────────────────────────────────────────────── */}
      {isExpired && (
        <div className="bg-orange-50 border-b border-orange-100 px-4 py-2 text-xs text-orange-700 font-inter text-center">
          ⏰ This chat is archived (48h post-delivery). Messages are read-only.
        </div>
      )}

      {/* ── Message list ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-neutral-50">

        {/* Load more */}
        {hasMore && (
          <div className="text-center py-1">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-inter disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : '↑ Load older messages'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-3xl mb-2">🔒</span>
            <p className="text-sm text-neutral-500 font-inter">No messages yet.</p>
            <p className="text-xs text-neutral-400 font-inter mt-1">
              Start the conversation securely.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUser?.userId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {/* Sender name (only for other party) */}
                  {!isOwn && (
                    <span className="text-xs text-neutral-500 font-inter px-1">
                      {msg.senderName}
                    </span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm font-inter leading-relaxed break-words
                      ${isOwn
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-white text-[#0A2540] border border-neutral-200 rounded-bl-sm shadow-sm'
                      }`}
                  >
                    {msg.content}
                  </div>
                  {/* Timestamp + read receipt */}
                  <div className={`flex items-center gap-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-[10px] text-neutral-400 font-inter">
                      {formatTime(msg.createdAt)}
                    </span>
                    {isOwn && (
                      <span className="text-[10px]" title={msg.isRead ? 'Seen' : 'Delivered'}>
                        {msg.isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-500 font-inter italic">{typingUser}</span>
                <span className="flex gap-0.5 ml-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ────────────────────────────────────────────────────── */}
      <div className="px-3 py-3 bg-white border-t border-neutral-100">
        {isExpired ? (
          <div className="text-center text-sm text-neutral-400 font-inter py-1">
            Chat is archived — no new messages allowed.
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none px-3 py-2 border border-neutral-200 rounded-xl text-sm font-inter text-[#0A2540] bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder-neutral-400 max-h-24 overflow-y-auto"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white rounded-xl flex items-center justify-center transition-all duration-150 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderChat;
