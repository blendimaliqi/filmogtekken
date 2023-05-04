import Link from "next/link";
import React from "react";
import { FaInfoCircle } from "react-icons/fa";

function MovieTitle(movie: any) {
  return (
    <div
      className="flex flex-col items-start justify-center h-full mt-52 p-24 z-10000"
      style={{ zIndex: "100" }}
    >
      <h1
        className="text-4xl md:text-6xl lg:text-8xl 
      //text at start 
      text-left
      font-bold text-white py-8 cursor-pointer z-9000"
        style={{ zIndex: 9090 }}
      >
        {movie.movie.title}
      </h1>

      {movie.movie.rating && (
        <h2
          className="text-4xl py-2 font-bold text-white z-9000  cursor-pointer whitespace-nowrap"
          style={{ zIndex: 9090 }}
        >
          Rating: {movie.movie.rating}
        </h2>
      )}

      <div className="flex">
        {movie.movie.genres &&
          movie.movie.genres.map((genre: string) => (
            <p className="mr-4 text-2xl font-light" key={genre}>
              {genre}
            </p>
          ))}
      </div>
      <Link
        href={`/${movie.movie._id}`}
        className="
     
          flex flex-row items-center
          justify-center
          bg-gray-800 
          hover:bg-gray-700
          transition duration-300 ease-in-out
          cursor-pointer
      
    
          hover:border-opacity-50
          rounded-2xl
          p-2
          h-16
          w-64
          mt-4
        "
      >
        <FaInfoCircle size={23} color="white" />
        <p className=" ml-4 text-3xl text-white font-semibold">Mer info</p>
      </Link>
    </div>
  );
}

export default MovieTitle;
