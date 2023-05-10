import Link from "next/link";
import React from "react";

type Props = {};

function MiniNav({}: Props) {
  return (
    <nav className="flex flex-row w-full justify-center md:hidden mt-10 z-[90000000]">
      <ul className="flex flex-row text-gray-400 font-semibold space-x-4 text-2xl cursor-pointer justify-between z-50">
        <li className="  border-transparent hover:text-gray-200 transition duration-300 ease-in-out p-2 z-50">
          <Link href="/">Film</Link>
        </li>

        <li className="ml-10  border-transparent hover:text-gray-200 transition duration-300 ease-in-out p-2 z-50">
          <Link href="/tekken">Tekken</Link>
        </li>
      </ul>
    </nav>
  );
}

export default MiniNav;
