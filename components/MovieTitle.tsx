import Link from "next/link";
import React, { useMemo } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import { uuidv4 } from "@/utils/helperFunctions";

type MovieTitleProps = {
  movie: any;
};

function MovieTitle({ movie }: MovieTitleProps) {
  // Simplify rating calculation for better consistency
  const averageRating = useMemo(() => {
    try {
      const ratings = movie?.ratings;

      // More robust null/undefined check
      if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
        return null;
      }

      const sum = ratings.reduce((acc: number, curr: any) => {
        // Handle both direct number values and nested rating objects
        if (typeof curr === "number") return acc + curr;
        const rating = curr?.rating ? Number(curr.rating) : 0;
        return acc + rating;
      }, 0);

      return (sum / ratings.length).toFixed(1);
    } catch (error) {
      console.error("Error calculating average rating:", error);
      return null;
    }
  }, [movie?.ratings]);

  // Safely access movie properties
  const title = movie?.title || "Loading...";
  const releaseDate = movie?.releaseDate;
  const genres = movie?.genres || [];
  const plot = movie?.plot;
  const movieId = movie?._id;
  const ratingsCount = movie?.ratings?.length || 0;

  return (
    <div className="absolute bottom-0 left-0 w-full px-4 sm:px-8 md:px-16 lg:px-24 pb-10 sm:pb-16 md:pb-24 lg:pb-32 z-10">
      <div className="max-w-5xl text-left">
        {/* Title without underline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg">
          {title}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
          {averageRating && (
            <div className="flex items-center bg-yellow-600/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-white group relative">
              <span className="text-sm font-medium mr-1">{averageRating}</span>
              <AiFillStar className="text-white" size={16} />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {ratingsCount} {ratingsCount === 1 ? "rating" : "ratings"}
              </div>
            </div>
          )}

          {releaseDate && (
            <div className="bg-gray-800 bg-opacity-70 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-md">
              <span className="text-sm font-medium text-white">
                {releaseDate.split("-")[0]}
              </span>
            </div>
          )}

          {genres.length > 0 &&
            genres.slice(0, 2).map((genre: string) => (
              <div
                key={uuidv4()}
                className="bg-gray-800 bg-opacity-70 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-md"
              >
                <span className="text-sm font-medium text-white">{genre}</span>
              </div>
            ))}
        </div>

        {/* Plot without background */}
        {plot && (
          <p className="text-white text-sm sm:text-base md:text-lg max-w-3xl mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 drop-shadow-md">
            {plot}
          </p>
        )}

        {/* Call to action button */}
        <Link
          draggable={false}
          href={`/${movieId || ""}`}
          className="inline-flex items-center justify-center bg-gray-500 bg-opacity-30 hover:bg-opacity-20 text-white font-medium rounded-xl px-4 sm:px-6 py-2 sm:py-3 transition duration-300 ease-in-out"
        >
          <FaInfoCircle size={16} className="mr-2" />
          <span className="text-sm sm:text-base md:text-lg">Se detaljer</span>
        </Link>
      </div>
    </div>
  );
}

export default MovieTitle;
