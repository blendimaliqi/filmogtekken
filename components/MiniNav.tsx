import Link from "next/link";
import React from "react";

type Props = {};

function MiniNav({}: Props) {
  return (
    <nav className="flex flex-row w-full justify-center md:hidden mt-10">
      <ul className="flex flex-row text-gray-400 font-semibold space-x-4 text-2xl cursor-pointer justify-between">
        <li className=" border-b-2 border-transparent hover:text-gray-200 transition duration-300 ease-in-out p-2">
          <Link href="/">Film</Link>
        </li>

        <li className="ml-10 border-b-2 border-transparent hover:text-gray-200 transition duration-300 ease-in-out p-2">
          <Link href="/tekken">Tekken</Link>
        </li>
      </ul>
    </nav>
  );
}

export default MiniNav;
