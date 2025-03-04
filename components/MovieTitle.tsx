import Link from "next/link";
import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import { uuidv4 } from "@/utils/helperFunctions";

function MovieTitle(movie: any) {
  return (
    <div
      className="flex flex-col items-start justify-center h-full p-8 md:p-16 lg:p-24 z-10"
    >
      <h1 className="text-3xl md:text-5xl lg:text-7xl text-left font-bold text-white pb-6 drop-shadow-lg">
        {movie.movie.title}
      </h1>
      
      <div className="flex items-center space-x-4 mb-4">
        {movie.movie.ratings && movie.movie.ratings.length > 0 && (
          <div className="flex items-center bg-yellow-500/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
            <span className="text-lg md:text-xl font-semibold text-white mr-1.5">
              {(
                movie.movie.ratings.reduce(
                  (acc: any, curr: any) => acc + curr.rating,
                  0
                ) / movie.movie.ratings.length
              ).toFixed(1)}
            </span>
            <AiFillStar className="text-white" size={22} />
          </div>
        )}
        
        {movie.movie.releaseDate && (
          <div className="text-lg md:text-xl font-medium text-white/90 bg-gray-800/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            {movie.movie.releaseDate.split("-")[0]}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {movie.movie.genres &&
          movie.movie.genres.map((genre: string) => (
            <div
              key={uuidv4()}
              className="bg-gray-700/50 backdrop-blur-sm px-3 py-1 rounded-lg text-white/90 text-sm md:text-base"
            >
              {genre}
            </div>
          ))}
      </div>
      
      {movie.movie.plot && (
        <p className="text-white/80 text-base md:text-lg max-w-2xl mb-6 line-clamp-3">
          {movie.movie.plot}
        </p>
      )}
      
      <Link
        draggable={false}
        href={`/${movie.movie._id}`}
        className="inline-flex items-center justify-center bg-gray-500 bg-opacity-30 hover:bg-opacity-20 text-white font-medium rounded-xl px-6 py-3 transition duration-300 ease-in-out"
      >
        <FaInfoCircle size={18} className="mr-2" />
        <span className="text-base md:text-lg">Se detaljer</span>
      </Link>
    </div>
  );
}

export default MovieTitle;
