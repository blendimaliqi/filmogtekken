import React from "react";
import { FaInfoCircle } from "react-icons/fa";

function MovieTitle(movie: any) {
  return (
    <div className="flex flex-col p-24 mt-44">
      <h1 className="text-9xl py-8 font-bold text-white  cursor-pointer whitespace-nowrap">
        {movie.movie.title}
      </h1>
      <h2 className="text-4xl py-2 font-bold text-white  cursor-pointer whitespace-nowrap">
        Samlet rating: 7.9
      </h2>
      <button
        className="
        //create grayish background with transparent
        bg-gray-500 bg-opacity-80
        hover:bg-gray-700
        w-52
        transition duration-300 ease-in-out
        text-white
        p-4
        rounded-lg
        text-2xl
        mt-4
        flex
        justify-center
        items-center
        "
      >
        <FaInfoCircle /> <p className="ml-4">Mer info</p>
      </button>
    </div>
  );
}

export default MovieTitle;
