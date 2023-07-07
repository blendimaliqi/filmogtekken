import Link from "next/link";
import React from "react";
// import LoginButton from "./LoginButton";

type Props = {};

function Nav({}: Props) {
  return (
    <div
      className="hidden md:flex items-center p-24 w-screen 
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

      <nav className="md:flex md:flex-row md:w-screen md:justify-between hidden items-center">
        <ul className="flex flex-row w-full text-gray-400 font-semibold space-x-4 text-2xl cursor-pointer">
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
        {/* <LoginButton /> */}
      </nav>
    </div>
  );
}

export default Nav;
