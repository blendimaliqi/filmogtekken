import React from "react";
import Image from "next/image";
import { AiFillStar } from "react-icons/ai";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
  id: number;
  movie: any;
}

function ModalMovie({ poster, movie }: MovieProps) {
  const url = `https://image.tmdb.org/t/p/w500/${poster}`;
  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : "";
  const genres = movie.genre_ids ? movie.genre_ids.slice(0, 2) : [];

  // Map genre IDs to genre names (simplified version)
  const genreMap: { [key: number]: string } = {
    28: "Action",
    12: "Eventyr",
    16: "Animasjon",
    35: "Komedie",
    80: "Krim",
    99: "Dokumentar",
    18: "Drama",
    10751: "Familie",
    14: "Fantasy",
    36: "Historie",
    27: "Skrekk",
    10402: "Musikk",
    9648: "Mysterie",
    10749: "Romantikk",
    878: "Sci-Fi",
    10770: "TV-Film",
    53: "Thriller",
    10752: "Krig",
    37: "Western",
  };

  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg h-full bg-gray-900/80 backdrop-blur-sm border border-gray-800/50">
      {poster ? (
        <>
          <div className="relative aspect-[2/3] overflow-hidden">
            <Image
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              width={300}
              height={450}
              src={url}
              alt={movie.title || "Movie poster"}
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

            {/* Rating badge */}
            <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-black/60 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 flex items-center gap-0.5">
              <AiFillStar className="text-yellow-500" size={12} />
              <span className="text-white text-[10px] sm:text-xs font-medium">
                {movie.vote_average.toFixed(1)}
              </span>
            </div>

            {/* Year badge */}
            {releaseYear && (
              <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black/60 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5">
                <span className="text-white text-[10px] sm:text-xs font-medium">
                  {releaseYear}
                </span>
              </div>
            )}

            {/* Genres */}
            <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 right-1 sm:right-2 flex flex-wrap gap-1">
              {genres.map((genreId: number) => (
                <span
                  key={genreId}
                  className="text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-blue-600/70 backdrop-blur-sm rounded-full text-white"
                >
                  {genreMap[genreId] || "Genre"}
                </span>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-1 sm:p-2 text-center">
            <h3 className="text-white font-medium text-xs sm:text-sm line-clamp-1">
              {movie.title}
            </h3>
          </div>

          {/* Hover overlay with add button - Only display on devices that support hover */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex flex-col items-center justify-center p-2 sm:p-3">
            <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-2 mb-1 sm:mb-2 text-center">
              {movie.title}
            </h3>

            {movie.overview && (
              <p className="text-gray-300 text-[10px] sm:text-xs line-clamp-3 mb-2 sm:mb-3 text-center">
                {movie.overview}
              </p>
            )}

            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="flex items-center">
                <AiFillStar
                  className="text-yellow-500 mr-0.5 sm:mr-1"
                  size={14}
                />
                <span className="text-white text-xs sm:text-sm">
                  {movie.vote_average.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-400 text-[10px] sm:text-xs">
                ({movie.vote_count})
              </span>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 sm:h-4 sm:w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Legg til
            </button>
          </div>

          {/* Touch-friendly version for mobile - Always visible */}
          <button className="absolute bottom-0 left-0 right-0 bg-blue-600 hover:bg-blue-500 text-white py-1 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Legg til
          </button>
        </>
      ) : (
        <div className="flex items-center justify-center bg-gray-800 aspect-[2/3] rounded-lg p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 sm:h-10 sm:w-10 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4v16M17 4v16M3 8h18M3 16h18"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default ModalMovie;
