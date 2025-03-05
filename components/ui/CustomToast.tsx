import React from "react";
import {
  AiOutlineCheckCircle,
  AiOutlineWarning,
  AiOutlineInfoCircle,
} from "react-icons/ai";
import { MdOutlineClose } from "react-icons/md";
import { RiMovie2Line } from "react-icons/ri";
import Image from "next/image";

interface CustomToastProps {
  title: string;
  message: string;
  type: "success" | "error" | "info";
  closeToast?: () => void;
  posterUrl?: string;
}

const CustomToast: React.FC<CustomToastProps> = ({
  title,
  message,
  type,
  closeToast,
  posterUrl,
}) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <AiOutlineCheckCircle size={22} className="text-green-500" />;
      case "error":
        return <AiOutlineWarning size={22} className="text-red-500" />;
      case "info":
        return <AiOutlineInfoCircle size={22} className="text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "border-l-green-500 bg-gradient-to-r from-gray-900 to-gray-800";
      case "error":
        return "border-l-red-500 bg-gradient-to-r from-gray-900 to-gray-800";
      case "info":
        return "border-l-blue-500 bg-gradient-to-r from-gray-900 to-gray-800";
    }
  };

  return (
    <div
      className={`flex w-full max-w-sm overflow-hidden rounded-lg shadow-lg border-l-4 ${getBgColor()}`}
    >
      {posterUrl && (
        <div className="relative w-16 h-auto">
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {!posterUrl && <div className="flex-shrink-0">{getIcon()}</div>}
            <div className="ml-3 flex items-center">
              {posterUrl ? (
                <RiMovie2Line size={18} className="mr-2 text-yellow-500" />
              ) : null}
              <p className="text-sm font-medium text-white">{title}</p>
            </div>
          </div>

          <button
            onClick={closeToast}
            className="ml-4 inline-flex text-gray-400 focus:outline-none hover:text-white"
          >
            <MdOutlineClose size={18} />
          </button>
        </div>

        <p className="mt-1 text-sm text-gray-300">{message}</p>
      </div>
    </div>
  );
};

export default CustomToast;
