import { toast as hotToast } from 'react-hot-toast';

const fmt = (title: string, message: string) =>
  message ? `${title} — ${message}` : title;

/** Convenience helpers — all route through react-hot-toast */
export const toast = {
  success: (title: string, message = '') =>
    hotToast.success(fmt(title, message)),
  error: (title: string, message = '') =>
    hotToast.error(fmt(title, message), { duration: 8000 }),
  info: (title: string, message = '') =>
    hotToast(fmt(title, message), {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) as any,
    }),
  lead: (title: string, message = '') =>
    hotToast(fmt(title, message), {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ) as any,
    }),
  transfer: (title: string, message = '') =>
    hotToast(fmt(title, message), {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ) as any,
    }),
};
