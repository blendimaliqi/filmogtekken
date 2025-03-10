import React from "react";
import { AiFillStar } from "react-icons/ai";
import { signIn } from "next-auth/react";

interface RatingButtonProps {
  session: any;
  setOpen: (value: boolean) => void;
  open: boolean;
}

function RatingButton({ session, setOpen, open }: RatingButtonProps) {
  if (session) {
    return (
      <button
        className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg py-3 px-6 font-medium flex items-center gap-2"
        onClick={() => setOpen(!open)}
      >
        <AiFillStar size={18} />
        <span>Rate denne filmen</span>
      </button>
    );
  }

  return (
    <button
      className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg py-3 px-6 font-medium flex items-center gap-2"
      onClick={() => signIn()}
    >
      <AiFillStar size={18} />
      <span>Logg inn for å rate</span>
    </button>
  );
}

export default RatingButton;
