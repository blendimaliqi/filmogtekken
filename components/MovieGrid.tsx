import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Movie } from "@/typings";
import { urlFor } from "@/config/client";

const MovieComponent = dynamic(() => import("./Movie"), { ssr: false });

interface MovieGridProps {
  movies: Movie[];
  isMobile: boolean;
}

export function MovieGrid({ movies, isMobile }: MovieGridProps) {
  // Debug logs
  console.log("MovieGrid - movies:", movies);
  console.log("MovieGrid - isMobile:", isMobile);

  // If no movies, show a message
  if (!movies || movies.length === 0) {
    return (
      <div className="text-center text-white py-8">
        <p>No movies found</p>
      </div>
    );
  }

  const initialBatchSize = isMobile ? 10 : movies.length;
  const [displayCount, setDisplayCount] = useState(initialBatchSize);
  console.log("MovieGrid - initialBatchSize:", initialBatchSize);
  console.log("MovieGrid - displayCount:", displayCount);

  const displayedMovies = useMemo(() => {
    if (!movies || !Array.isArray(movies)) return [];
    const sliced = movies.slice(0, displayCount);
    console.log("MovieGrid - sliced movies:", sliced);
    return sliced;
  }, [movies, displayCount]);

  // Debug logs for displayed movies
  console.log("MovieGrid - displayedMovies:", displayedMovies);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        setDisplayCount((prev) => {
          const next = prev + 10;
          return next > movies.length ? movies.length : next;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, movies.length]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 px-4 md:px-8 pb-8">
      {displayedMovies.map((movie) => {
        try {
          // Debug log for each movie
          console.log("MovieGrid - processing movie:", {
            id: movie._id,
            title: movie.title,
            poster: movie.poster,
          });

          // Generate poster URL
          const posterUrl = urlFor(movie.poster).url();
          console.log("MovieGrid - generated posterUrl:", posterUrl);

          return (
            <MovieComponent
              key={movie._id}
              title={movie.title}
              year={new Date(movie.releaseDate).getFullYear().toString()}
              poster={posterUrl}
              movie={movie}
            />
          );
        } catch (error) {
          console.error("Error rendering movie:", error, movie);
          return null;
        }
      })}

      {/* Show load more button on mobile if there are more movies to display */}
      {isMobile && displayCount < movies.length && (
        <div className="col-span-full flex justify-center pb-8">
          <button
            onClick={() =>
              setDisplayCount((prev) => Math.min(prev + 10, movies.length))
            }
            className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Vis flere filmer
          </button>
        </div>
      )}
    </div>
  );
}
