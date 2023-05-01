import Link from "next/link";
import React from "react";
//Import searchicon with outline from react icons
import { FaSearch } from "react-icons/fa";



type Props = {};

function Nav({}: Props) {
  return (
    <div className="flex items-center p-24">
      <h1
        className="
    text-5xl font-bold
    text-yellow-400
    hover:text-yellow-700
    transition duration-300 ease-in-out
    cursor-pointer
    whitespace-nowrap
    "
    
     
      >
        Film og Tekken
      </h1>
      <nav className="flex flex-row w-full justify-between">

        <ul
          className="
            flex flex-row
            text-gray-400 
            font-semibold
            space-x-4
            text-2xl 
            cursor-pointer
            //make the ul 80& of the screen

            justify-between
            "
        >


          <li
            className="ml-10
  border-b-2 border-transparent
  hover:text-gray-200

  transition duration-300 ease-in-out
  p-2
"
          >
            <Link href="/film">Film</Link>
          </li>

          <li
            className="ml-10
  border-b-2 border-transparent
  hover:text-gray-200

  transition duration-300 ease-in-out
  p-2
"
          >
            <Link href="/tekken">Tekken</Link>
          </li>
  
        </ul>
       <FaSearch />
      </nav>
    </div>
  );
}

export default Nav;
