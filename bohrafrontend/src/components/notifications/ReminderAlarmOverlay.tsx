import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useNotifications } from '../../hooks/useNotifications';
import type { ReminderAlarm } from '../../providers/NotificationsProvider';

/* ──────────────── Alarm sound generator ──────────────── */

function useAlarmSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playAlarmBeep = useCallback(() => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      const now = ctx.currentTime;

      // Two-tone alarm pattern
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        const offset = i * 0.3;
        osc.frequency.setValueAtTime(880, now + offset);
        osc.frequency.setValueAtTime(660, now + offset + 0.1);
        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.25);
        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      }
    } catch { /* AudioContext unavailable */ }
  }, []);

  const startRinging = useCallback(() => {
    if (intervalRef.current) return;
    playAlarmBeep();
    intervalRef.current = setInterval(playAlarmBeep, 3000);
  }, [playAlarmBeep]);

  const stopRinging = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { stopRinging(); };
  }, [stopRinging]);

  return { startRinging, stopRinging };
}

/* ──────────────── Single Alarm Card ──────────────── */

function AlarmCard({
  alarm,
  onDismiss,
  onSnooze,
}: {
  alarm: ReminderAlarm;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}) {
  const formattedDue =
    alarm.dueDate && dayjs(alarm.dueDate).isValid()
      ? dayjs(alarm.dueDate).format('DD MMM YYYY, hh:mm A')
      : null;

  const isMissed = alarm.id.startsWith('missed:');
  const isPastDue = alarm.dueDate && dayjs(alarm.dueDate).isValid() && dayjs(alarm.dueDate).isBefore(dayjs());

  const timeSince = dayjs(alarm.createdAt).isValid()
    ? dayjs(alarm.createdAt).fromNow?.() || dayjs(alarm.createdAt).format('hh:mm A')
    : '';

  return (
    <div
      className={
        `w-full max-w-lg bg-white rounded-lg shadow-lg border border-gray-200
        flex flex-col overflow-hidden transform transition-all duration-200`}
      role="alertdialog"
      aria-label="Task alarm"
    >
      {/* Pulsing red top bar */}
      <div className="h-1.5 w-full bg-linear-to-r from-red-500 via-orange-400 to-red-500" />

      <div className="px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Animated alarm icon */}
          <div className="shrink-0 w-12 h-12 rounded-md bg-red-50 border border-red-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405C18.21 15.21 18 14.622 18 14V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3c0 .622-.21 1.21-.595 1.595L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wider ${
                isMissed || isPastDue
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {isMissed || isPastDue ? 'Missed' : 'Due'}
              </span>
              {timeSince && (
                <span className="text-xs text-gray-400">{timeSince}</span>
              )}
            </div>

            <p className="text-lg font-semibold text-gray-900 mt-2 leading-tight">
              {alarm.taskTitle}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onDismiss}
            className="shrink-0 w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss alarm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message */}
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          {alarm.message}
        </p>

        {/* Due date chip */}
        {formattedDue && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50 border border-gray-100">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">Due: {formattedDue}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex items-center gap-3 border-t border-gray-100 pt-3">
        {/* Snooze buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mr-2">Snooze</span>
          <button
            onClick={() => onSnooze(5)}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            5 min
          </button>
          <button
            onClick={() => onSnooze(10)}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            10 min
          </button>
        </div>

        <div className="flex-1" />

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/* ──────────────── Main Overlay ──────────────── */

const ReminderAlarmOverlay = () => {
  const { reminderAlarms, dismissAlarm } = useNotifications();
  const { startRinging, stopRinging } = useAlarmSound();
  const [snoozed, setSnoozed] = useState<Map<string, number>>(new Map());
  const snoozeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleSnooze = useCallback((alarm: ReminderAlarm, minutes: number) => {
    // Dismiss alarm now
    dismissAlarm(alarm.id);
    stopRinging();

    const snoozeId = `${alarm.id}_snooze_${Date.now()}`;
    setSnoozed(prev => new Map(prev).set(snoozeId, minutes));

    // Re-trigger after snooze period
    const timer = setTimeout(() => {
      const snoozePayload = {
        ...(alarm.payload as any),
        _id: `${alarm.id}_snoozed_${Date.now()}`,
        title: alarm.taskTitle,
        message: `[Snoozed ${minutes}min] ${alarm.message}`,
        dueDate: alarm.dueDate,
        taskTitle: alarm.taskTitle,
      };
      window.dispatchEvent(new CustomEvent('alarm:snoozed', { detail: snoozePayload }));

      setSnoozed(prev => {
        const next = new Map(prev);
        next.delete(snoozeId);
        return next;
      });
      snoozeTimersRef.current.delete(snoozeId);
    }, minutes * 60 * 1000);

    snoozeTimersRef.current.set(snoozeId, timer);
  }, [dismissAlarm, stopRinging]);

  // Start/stop alarm sound based on active alarms
  useEffect(() => {
    if (reminderAlarms.length > 0) {
      startRinging();
    } else {
      stopRinging();
    }
  }, [reminderAlarms.length, startRinging, stopRinging]);

  // Cleanup snooze timers on unmount
  useEffect(() => {
    return () => {
      snoozeTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const handleDismiss = useCallback((id: string) => {
    dismissAlarm(id);
    if (reminderAlarms.length <= 1) {
      stopRinging();
    }
  }, [dismissAlarm, reminderAlarms.length, stopRinging]);

  const handleDismissAll = useCallback(() => {
    reminderAlarms.forEach((a) => dismissAlarm(a.id));
    stopRinging();
  }, [reminderAlarms, dismissAlarm, stopRinging]);

  if (reminderAlarms.length === 0 && snoozed.size === 0) return null;

  const visibleAlarms = reminderAlarms.slice(0, 3);
  const hiddenCount = Math.max(0, reminderAlarms.length - 3);

  return (
    <>
      {/* Backdrop overlay when alarms are active */}
      {reminderAlarms.length > 0 && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-9999" />
      )}

      {/* Alarm cards */}
      <div
        className="fixed inset-0 z-10000 flex items-center justify-center p-4 pointer-events-none"
        aria-live="assertive"
      >
        <div className="flex flex-col gap-3 items-center max-h-[80vh] overflow-y-auto pointer-events-auto w-full max-w-md scrollbar-hide animate-fade-scale">
          {/* Header bar when multiple alarms */}
          {reminderAlarms.length > 1 && (
            <div className="w-full flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {reminderAlarms.length}
                </span>
                <span className="text-sm font-medium text-white drop-shadow-sm">
                  Active Reminder{reminderAlarms.length > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={handleDismissAll}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500/90 hover:bg-red-600 rounded-lg transition-colors backdrop-blur-sm shadow-sm"
              >
                Dismiss All
              </button>
            </div>
          )}

          {visibleAlarms.map((alarm) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              onDismiss={() => handleDismiss(alarm.id)}
              onSnooze={(mins) => handleSnooze(alarm, mins)}
            />
          ))}

          {/* Hidden alarms indicator */}
          {hiddenCount > 0 && (
            <div className="w-full px-4 py-2.5 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 text-center shadow-sm">
              <span className="text-xs font-medium text-gray-600">
                +{hiddenCount} more reminder{hiddenCount > 1 ? 's' : ''} waiting
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Snoozed indicator */}
      {snoozed.size > 0 && reminderAlarms.length === 0 && (
        <div className="fixed bottom-20 right-5 z-9997 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-medium text-orange-600">
              {snoozed.size} snoozed reminder{snoozed.size > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default ReminderAlarmOverlay;
