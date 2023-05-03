import React from "react";
import { FaInfoCircle } from "react-icons/fa";

function MovieTitle(movie: any) {
  return (
    <div className="flex flex-col items-start p-24 z-10000" style={{ zIndex: "100" }}>
      <h1 className="text-4xl md:text-6xl lg:text-8xl mt-96
      //text at start 
      text-left
      font-bold text-white py-8 cursor-pointer z-9000" style={{zIndex: 9090}}>
        {movie.movie.title}
      </h1>

      <h2 className="text-4xl py-2 font-bold text-white z-9000  cursor-pointer whitespace-nowrap" style={{zIndex:9090}}>
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
        <FaInfoCircle /> <p className="">Mer info</p>
      </button>
    </div>
  );
}

export default MovieTitle;
