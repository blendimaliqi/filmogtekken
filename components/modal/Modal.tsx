// components/Modal.tsx
import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-scroll custom-scrollbar">
          <div className="absolute inset-0 bg-black opacity-10 overflow-y-scroll z-50 custom-scrollbar" />
          <div
            ref={ref}
            className="text-white shadow-xl w-3/4 h-4/5 bg-gray-800
            z-50 rounded-3xl custom-scrollbar py-14 px-5
            //overflow
            overflow-y-scroll
          "
          >
            {children}
          </div>
        </div>
      )}
    </>
  );
};
