import { useEffect, useRef } from 'react';
import { toast as hotToast } from 'react-hot-toast';
import { useNotifications } from '../../hooks/useNotifications';

function eventToIcon(event: string): string {
  if (event.includes('transferred')) return '↔️';
  if (event.includes('status')) return '🔄';
  if (event.includes('lead') || event.includes('followup')) return '👤';
  if (event.includes('success')) return '✅';
  if (event.includes('warning') || event.includes('error')) return '⚠️';
  return '🔔';
}

/** Listens to socket notifications and forwards them to react-hot-toast */
export const ToastStack = () => {
  const { notifications } = useNotifications();
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];

    if (!latest || seenRef.current.has(latest.id)) return;
    if (latest.event === 'notifications:list') return;
    if (latest.event === 'reminder:triggered' || latest.event === 'task:due-soon') return;
    if (/reminder|task due/i.test(latest.title)) return;

    seenRef.current.add(latest.id);

    // Subtle audio pulse
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch { /* skip */ }

    hotToast(latest.message || latest.title, {
      icon: eventToIcon(latest.event),
      duration: 6000,
    });
  }, [notifications]);

  return null;
};

export default ToastStack;
