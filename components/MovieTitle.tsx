import Link from "next/link";
import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import { uuidv4 } from "@/utils/helperFunctions";

function MovieTitle(movie: any) {
  return (
    <div className="absolute bottom-0 left-0 w-full px-8 md:px-16 lg:px-24 pb-16 md:pb-24 lg:pb-32 z-10">
      <div className="max-w-5xl text-left">
        {/* Title without underline */}
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg">
          {movie.movie.title}
        </h1>
        
        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {movie.movie.ratings && movie.movie.ratings.length > 0 && (
            <div className="flex items-center bg-yellow-600 bg-opacity-90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-lg group relative">
              <span className="text-lg font-semibold text-white mr-1">
                {(
                  movie.movie.ratings.reduce(
                    (acc: any, curr: any) => acc + curr.rating,
                    0
                  ) / movie.movie.ratings.length
                ).toFixed(1)}
              </span>
              <AiFillStar className="text-white" size={18} />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {movie.movie.ratings.length} {movie.movie.ratings.length === 1 ? "rating" : "ratings"}
              </div>
            </div>
          )}
          
          {movie.movie.releaseDate && (
            <div className="text-base font-medium text-white bg-gray-800 bg-opacity-70 backdrop-blur-sm px-3 py-1.5 rounded-md">
              {movie.movie.releaseDate.split("-")[0]}
            </div>
          )}
          
          {movie.movie.genres &&
            movie.movie.genres.slice(0, 3).map((genre: string) => (
              <div
                key={uuidv4()}
                className="bg-gray-700 bg-opacity-70 backdrop-blur-sm px-3 py-1.5 rounded-md text-white text-sm"
              >
                {genre}
              </div>
            ))}
        </div>
        
        {/* Plot without background */}
        {movie.movie.plot && (
          <p className="text-white text-base md:text-lg max-w-3xl mb-6 line-clamp-3 drop-shadow-md">
            {movie.movie.plot}
          </p>
        )}
        
        {/* Call to action button */}
        <Link
          draggable={false}
          href={`/${movie.movie._id}`}
          className="inline-flex items-center justify-center bg-gray-500 bg-opacity-30 hover:bg-opacity-20 text-white font-medium rounded-xl px-6 py-3 transition duration-300 ease-in-out"
        >
          <FaInfoCircle size={18} className="mr-2" />
          <span className="text-base md:text-lg">Se detaljer</span>
        </Link>
      </div>
    </div>
  );
}

export default MovieTitle;
