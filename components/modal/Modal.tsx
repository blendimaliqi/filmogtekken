import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999999]"
      style={{ pointerEvents: "auto" }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999999]"
        onClick={onClose}
        style={{ pointerEvents: "auto" }}
      />

      {/* Modal content */}
      <div
        className="relative z-[1000000] bg-gradient-to-b from-gray-900 to-black p-4 sm:p-6 rounded-xl border border-gray-800/50 shadow-xl w-full max-w-3xl mx-2 sm:mx-4 my-2 max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: "auto" }}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors z-10"
          onClick={onClose}
          style={{ pointerEvents: "auto" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal content wrapper with scrolling */}
        <div className="z-[1000000] overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
