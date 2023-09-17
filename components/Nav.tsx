import Link from "next/link";
import React from "react";
import { useAtom, atom } from "jotai"; // Import jotai
import LoginButton from "./LoginButton";
//import search icon from react icojns
import { AiOutlineSearch as SearchIcon } from "react-icons/ai";
import { searchTermJotai } from "./Movies";

// Create a jotai atom for the search input visibility
const isSearchOpenAtom = atom(false);

function Nav() {
  const [isSearchOpen, setIsSearchOpen] = useAtom(isSearchOpenAtom); // Use the jotai atom
  const [searchTerm, setSearchTerm] = useAtom(searchTermJotai);

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  return (
    <div className="hidden md:flex items-center p-24 w-[99.6vw] ">
      <Link
        draggable="false"
        href="/"
        className="text-3xl font-bold md:text-5xl text-yellow-400 hover:text-yellow-700 transition duration-300 ease-in-out cursor-pointer whitespace-nowrap"
      >
        Film og Tekken
      </Link>

      <nav className="md:flex md:flex-row md:w-screen md:justify-between hidden items-center">
        <ul className="flex flex-row w-full text-gray-400 font-semibold space-x-4 text-2xl">
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
        <div
          className="flex flex-row pr-4
        "
        >
          <button
            className="ml-5 p-2 text-gray-400 hover:text-gray-200 transition duration-300 ease-in-out"
            onClick={toggleSearch}
          >
            <SearchIcon className="w-6 h-6" />
          </button>
          {isSearchOpen && (
            <input
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              type="text"
              placeholder="Search"
              className={`bg-gray-800 text-gray-300 px-2 py-1 rounded 

                focus:outline-none 

                ${
                  isSearchOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
                } transform transition-transform duration-300 ease-in-out`}
            />
          )}
        </div>
        <LoginButton />
      </nav>
    </div>
  );
}

export default Nav;
