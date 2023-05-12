import Link from "next/link";
import React from "react";

type Props = {};

function Nav({}: Props) {
  return (
    <div
      className="hidden md:flex items-center p-24  
 "
    >
      <Link
        draggable="false"
        href="/"
        className="text-3xl font-bold md:text-5xl text-yellow-400 hover:text-yellow-700 transition duration-300 ease-in-out cursor-pointer whitespace-nowrap
    

        "
      >
        Film og Tekken
      </Link>

      <nav className="md:flex md:flex-row md:w-full md:justify-between hidden">
        <ul className="flex flex-row text-gray-400 font-semibold space-x-4 text-2xl cursor-pointer justify-between">
          <li className="ml-10 border-b-2 border-transparent hover:text-gray-200 transition duration-300 ease-in-out p-2">
            <Link draggable={false} href="/">
              Film
            </Link>
          </li>

          <li className="ml-10 border-b-2 border-transparent hover:text-gray-200 transition duration-300 ease-in-out p-2">
            <Link draggable={false} href="/tekken">
              Tekken
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Nav;
