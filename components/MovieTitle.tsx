import Link from "next/link";
import React from "react";
import { FaInfoCircle } from "react-icons/fa";

function MovieTitle(movie: any) {
  return (
    <div
      className="flex flex-col items-start justify-center h-full mt-16 md:mt-52 p-24 z-10000"
      style={{ zIndex: "100" }}
    >
      <h1
        className="text-2xl md:text-6xl lg:text-8xl 
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
            <div
              className="
                //make items wrap 
                flex flex-wrap
                //text size
                

              text-lg md:text-2xl font-light"
              key={genre}
            >
              <p className="mr-4">{genre}</p>
            </div>
          ))}
      </div>
      <Link
        href={`/${movie.movie._id}`}
        className="
        flex flex-row items-center
        justify-center
        bg-gray-500
        bg-opacity-70
        hover:bg-opacity-50
        transition duration-300 ease-in-out
        cursor-pointer
        rounded-2xl
        p-2
        w-40
        h-10
        md:h-16
        md:w-52
        mt-4
        "
      >
        <div className="flex flex-row items-center">
          <FaInfoCircle size={20} color="white" />
          <p className=" ml-4 text-base md:text-3xl text-white font-light">
            Mer info
          </p>
        </div>
      </Link>
    </div>
  );
}

export default MovieTitle;
