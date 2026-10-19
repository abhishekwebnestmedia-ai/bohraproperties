import React, { useEffect, useRef } from "react";
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, panelClassName = "" }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(isOpen, panelRef);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={`relative w-full  mx-4 ${panelClassName}`}
        style={{ overscrollBehavior: 'contain' }}
        // allow any grid/flex layout inside via children
      >
        <div className="overflow-hidden border shadow-lg rounded-2xl bg-white border-white/30">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
