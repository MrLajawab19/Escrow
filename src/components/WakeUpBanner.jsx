import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * WakeUpBanner
 *
 * On first mount, silently pings /health.
 * - If the backend responds within SHOW_AFTER_MS (3 s), the banner never appears.
 * - If the backend takes longer, a friendly "waking up" notice is shown.
 * - The banner is hidden the moment the backend responds (or if it errors out).
 *
 * No other app behaviour is changed.
 */
const SHOW_AFTER_MS = 3000; // show banner if backend hasn't replied within 3 s

export default function WakeUpBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer = null;
    let cancelled = false;

    const ping = async () => {
      // Start a 3-second timer; if still running when it fires, show the banner
      timer = setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, SHOW_AFTER_MS);

      try {
        // Use the same base URL the rest of the app uses, just reach /health
        const baseURL = import.meta.env.DEV
          ? ''
          : (import.meta.env.VITE_API_URL || '');

        await axios.get(`${baseURL}/health`, {
          timeout: 90_000,  // allow up to 90 s for a cold start
        });
      } catch {
        // Silently ignore errors — backend might still be starting
      } finally {
        clearTimeout(timer);
        if (!cancelled) setVisible(false);
      }
    };

    ping();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.6rem 1.1rem',
        borderRadius: '9999px',
        background: 'rgba(15, 23, 42, 0.92)',
        color: '#e2e8f0',
        fontSize: '0.85rem',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Spinner */}
      <span
        style={{
          display: 'inline-block',
          width: '0.9rem',
          height: '0.9rem',
          border: '2px solid rgba(99,179,237,0.4)',
          borderTopColor: '#63b3ed',
          borderRadius: '50%',
          animation: 'wakeup-spin 0.75s linear infinite',
        }}
      />
      ☕ Waking up the server, this can take up to a minute…
      <style>{`
        @keyframes wakeup-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

