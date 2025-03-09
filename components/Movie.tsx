import React, { useState, useEffect, memo } from "react";
import { urlFor } from "../config/client";
import Image from "next/image";
import Link from "next/link";
import { AiFillStar, AiOutlineComment } from "react-icons/ai";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
  movie: any;
}

const Movie = memo(function Movie({ title, poster, movie }: MovieProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const moviePath = movie.slug?.current || movie._id;

  const handleClick = () => {
    setIsLeaving(true);
  };

  // Calculate average rating
  const averageRating =
    movie.ratings && movie.ratings.length > 0
      ? (
          movie.ratings.reduce((acc: any, curr: any) => acc + curr.rating, 0) /
          movie.ratings.length
        ).toFixed(1)
      : null;

  // Get comment count
  const commentCount = movie.comments ? movie.comments.length : 0;

  // Optimize image URL
  const optimizedImageUrl = urlFor(poster)
    .width(isMobile ? 300 : 500)
    .height(isMobile ? 450 : 750)
    .url();

  return (
    <div className="movie-card-wrapper mb-1 px-0.5">
      <div
        className={`aspect-[2/3] relative rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 ease-out ${
          isLeaving
            ? "opacity-70 scale-95"
            : isHovered
            ? "translate-y-[-8px]"
            : ""
        }`}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onTouchStart={() => isMobile && setIsHovered(true)}
        onTouchEnd={() =>
          isMobile && setTimeout(() => setIsHovered(false), 500)
        }
      >
        <Link
          href={`/${moviePath}`}
          onClick={handleClick}
          className="block absolute inset-0 z-10"
          aria-label={`View details for ${title}`}
        />

        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}

        {/* Movie poster */}
        <div className="h-full w-full overflow-hidden">
          <Image
            className={`h-full w-full object-cover transition-transform duration-300 ease-out
              ${isHovered ? "scale-105" : "scale-100"}
              ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            draggable={false}
            width={isMobile ? 300 : 500}
            height={isMobile ? 450 : 750}
            src={optimizedImageUrl}
            alt={title || "Movie poster"}
            priority={false}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            style={{ objectPosition: "center" }}
          />
        </div>

        {/* Permanent gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent 
            transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Content container */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-5">
          {/* Static content - always visible */}
          <div className="z-[1]">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white line-clamp-2 drop-shadow-lg">
              {title}
            </h3>
            {movie.releaseDate && (
              <p className="text-xs sm:text-sm md:text-base text-gray-300 drop-shadow-md mt-1 mb-2">
                {movie.releaseDate.split("-")[0]}
              </p>
            )}
          </div>

          {/* Dynamic content - appears on hover with fade in transition */}
          <div
            className={`z-[1] transition-all duration-300 ease-out transform
              ${
                isHovered
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
          >
            {/* Rating and comments */}
            <div className="flex items-center space-x-3 mt-2 mb-2 sm:mb-4">
              {averageRating && (
                <div className="flex items-center">
                  <AiFillStar className="text-yellow-400 mr-1" size={16} />
                  <span className="text-white text-sm sm:text-base font-bold">
                    {averageRating}
                  </span>
                </div>
              )}

              {commentCount > 0 && (
                <div className="flex items-center">
                  <AiOutlineComment className="text-blue-300 mr-1" size={16} />
                  <span className="text-white text-sm sm:text-base font-bold">
                    {commentCount}
                  </span>
                </div>
              )}
            </div>

            {/* Genres if available */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2 sm:mb-4">
                {movie.genres
                  .slice(0, 2)
                  .map((genre: string, index: number) => (
                    <span
                      key={index}
                      className="text-[10px] sm:text-xs text-white/80 bg-white/10 px-1.5 sm:px-2 py-0.5 rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Movie;
