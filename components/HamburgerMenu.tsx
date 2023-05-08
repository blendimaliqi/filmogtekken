import { useState } from "react";
import NavItems from "./NavItems";
import React from "react";

function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className="p-3 space-y-2 bg-gray-600 rounded shadow md:hidden ml-4 cursor-pointer z-[90000]"
      onClick={() => toggleMenu()}
    >
      <span className="block w-6 h-0.5 bg-gray-100 animate-pulse"></span>
      <span className="block w-6 h-0.5 bg-gray-100 animate-pulse"></span>
      <span className="block w-6 h-0.5 bg-gray-100 animate-pulse"></span>
      {isOpen && <NavItems />}
    </div>
  );
}

export default HamburgerMenu;
