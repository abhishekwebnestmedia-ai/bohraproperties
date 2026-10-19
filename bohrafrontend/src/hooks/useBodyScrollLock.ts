import { useEffect, type RefObject } from 'react';

let lockCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';

function getScrollbarWidth() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = getScrollbarWidth();
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  lockCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  document.body.style.overflow = originalBodyOverflow;
  document.body.style.paddingRight = originalBodyPaddingRight;
}

const ALLOW_SCROLL_ATTRIBUTE = 'data-body-scroll-lock-allow';

export default function useBodyScrollLock(
  active: boolean,
  popupRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const eventTargetAllowsScroll = (target: EventTarget | null) => {
      if (!target || !(target instanceof Node)) return false;
      if (popupRef.current?.contains(target)) return true;
      if (target instanceof Element && target.closest(`[${ALLOW_SCROLL_ATTRIBUTE}]`)) return true;
      return false;
    };

    const handleWheel = (event: WheelEvent) => {
      if (eventTargetAllowsScroll(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (eventTargetAllowsScroll(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    lockBodyScroll();

    window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      unlockBodyScroll();
    };
  }, [active, popupRef]);
}
