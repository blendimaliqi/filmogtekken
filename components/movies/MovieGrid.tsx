import React from "react";
import dynamic from "next/dynamic";
import { uuidv4 } from "@/utils/helperFunctions";
import { Movie } from "@/typings";

// Use dynamic import for MovieComponent with SSR disabled for better mobile performance
const MovieComponent = dynamic(() => import("../Movie"), { ssr: false });

interface MovieGridProps {
  optimizedMovies: Movie[];
  isMobile: boolean;
  moviesToDisplay: Movie[];
  setOptimizedMovies: (movies: Movie[]) => void;
}

function MovieGrid({
  optimizedMovies,
  isMobile,
  moviesToDisplay,
  setOptimizedMovies,
}: MovieGridProps) {
  function handleLoadMore() {
    const currentCount = optimizedMovies.length;
    setOptimizedMovies(moviesToDisplay.slice(0, currentCount + 10));
  }

  return (
    <>
      {/* Movie grid - optimize for mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 px-4 md:px-8 pb-8">
        {optimizedMovies.map((movie: any) => (
          <MovieComponent
            key={movie._id || uuidv4()}
            title={movie.title}
            year={movie.year}
            poster={movie.poster.asset}
            movie={movie}
          />
        ))}
      </div>

      {/* Show load more button on mobile if there are more movies to display */}
      {isMobile && optimizedMovies.length < moviesToDisplay.length && (
        <div className="flex justify-center pb-8">
          <button
            onClick={handleLoadMore}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Vis flere filmer
          </button>
        </div>
      )}
    </>
  );
}

export default MovieGrid;
