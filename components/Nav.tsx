import Link from "next/link";
import { useRouter } from "next/router"; // Import useRouter
import { useAtom, atom } from "jotai";
import LoginButton from "./LoginButton";
import {
  AiOutlineSearch as SearchIcon,
  AiFillCloseCircle,
} from "react-icons/ai";
import { searchTermJotai } from "./Movies";
import { useEffect, useRef } from "react";

const isSearchOpenAtom = atom(false);

function Nav() {
  const [isSearchOpen, setIsSearchOpen] = useAtom(isSearchOpenAtom);
  const [searchTerm, setSearchTerm] = useAtom(searchTermJotai);
  const router = useRouter(); // Access the router

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Conditionally render the search input based on the route
  const isHomePage = router.pathname === "/";
  const searchInputClassName = `
    bg-gray-800 text-gray-300 px-2 py-2 pr-10 rounded-lg
    focus:outline-none
    transition-all duration-300 ease-in-out
    ${
      isSearchOpen
        ? "scale-100 opacity-100"
        : "scale-0 opacity-0 pointer-events-none"
    }
  `;

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Add an effect to focus the input when isSearchOpen becomes true
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      // Check if inputRef.current exists
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <div className="hidden md:flex items-center p-24 w-[99.6vw] ">
      <Link
        draggable="false"
        href="/"
        className="text-3xl font-bold md:text-5xl text-yellow-400 hover:text-yellow-700 transition duration-300 ease-in-out cursor-pointer whitespace-nowrap"
      >
        Film med Gutta
      </Link>

      <nav className="md:flex md:flex-row md:w-screen md:justify-between hidden items-center">
        <ul className="flex flex-row w-full text-gray-400 font-semibold space-x-4 text-2xl">
          {/* <li className="ml-10 border-b-2 border-transparent hover:text-gray-200 transition duration-300 ease-in-out p-2">
            <Link draggable={false} href="/">
              Film
            </Link>
          </li>
          <li className="ml-10 border-b-2 border-transparent hover:text-gray-200 transition duration-300 ease-in-out p-2">
            <Link draggable={false} href="/tekken">
              Tekken
            </Link>
          </li> */}
        </ul>
        <div className="flex flex-row pr-4">
          {isHomePage && (
            <div className="relative">
              <input
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
                type="text"
                placeholder="Søk"
                className={searchInputClassName}
                ref={inputRef}
              />
              {searchTerm && (
                <AiFillCloseCircle
                  className="absolute top-0 right-0 mt-3 mr-2 cursor-pointer text-gray-400 hover:text-gray-200 transition duration-300 ease-in-out"
                  onClick={() => {
                    clearSearch();
                  }}
                />
              )}
            </div>
          )}
          {isHomePage && (
            <button
              className="p-2 text-gray-400 hover:text-gray-200 transition duration-300 ease-in-out"
              onClick={toggleSearch}
            >
              <SearchIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        <LoginButton />
      </nav>
    </div>
  );
}

export default Nav;
