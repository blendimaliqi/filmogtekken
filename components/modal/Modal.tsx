import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleClickInside = (event: React.MouseEvent) => {
    event.stopPropagation();
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mouseup", handleClickOutside);
    return () => {
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-scroll custom-scrollbar">
          <div className="absolute inset-0 bg-black opacity-50 overflow-y-scroll z-50 custom-scrollbar" />
          <div
            ref={ref}
            className="text-white shadow-xl w-3/4 h-4/5 bg-gray-800 
            z-50 rounded-3xl custom-scrollbar py-14 px-5
            overflow-y-scroll"
            onClick={handleClickInside}
          >
            {children}
          </div>
        </div>
      )}
    </>
  );
};
