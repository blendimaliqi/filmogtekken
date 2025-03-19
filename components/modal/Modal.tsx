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
      document.body.style.touchAction = "none"; // Prevent touch scrolling

      // Add global class to handle carousel dot overlaps
      document.body.classList.add("modal-open");
    } else {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";

      // Remove global class when modal closes
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999999]"
      style={{ pointerEvents: "auto" }}
    >
      {/* Backdrop with higher z-index to cover all elements */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999999]"
        onClick={onClose}
        style={{ pointerEvents: "auto" }}
      />

      {/* Modal content with even higher z-index */}
      <div
        className="relative z-[10000000] bg-gradient-to-b from-gray-900 to-black p-4 sm:p-6 rounded-xl border border-gray-800/50 shadow-xl w-full max-w-3xl mx-2 sm:mx-4 my-2 max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: "auto", touchAction: "auto" }}
      >
        {/* Close button */}
        <button
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-yellow-300 transition-colors z-[10000001] bg-gray-800/60 p-2 rounded-full shadow-lg touch-manipulation"
          onClick={onClose}
          style={{ pointerEvents: "auto" }}
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal content wrapper with scrolling */}
        <div
          className="z-[10000000] overflow-y-auto flex-1"
          style={{ WebkitOverflowScrolling: "touch" }} // Smooth scrolling on iOS
        >
          {children}
        </div>
      </div>
    </div>
  );
};
