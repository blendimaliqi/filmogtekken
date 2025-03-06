import React, { useState, useEffect, memo } from "react";
import { useRouter } from "next/router";
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

// Memoize the Movie component to prevent unnecessary re-renders
const Movie = memo(function Movie({ title, poster, movie }: MovieProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Check if device is mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get the correct URL path
  const moviePath = movie.slug?.current || movie._id;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Start the leaving animation
    setIsLeaving(true);

    // Use a more lightweight approach for mobile
    if (isMobile) {
      router.push(`/${moviePath}`);
      return;
    }

    // Create a full-screen black overlay with loading spinner
    const overlay = document.createElement("div");
    overlay.id = "movie-loading-overlay";
    overlay.className =
      "fixed inset-0 bg-black z-50 flex flex-col items-center justify-center transition-opacity duration-300";
    overlay.style.opacity = "0";

    // Use the standardized spinner
    const spinnerContainer = document.createElement("div");
    spinnerContainer.className = "flex flex-col items-center";

    const spinner = document.createElement("div");
    spinner.className =
      "animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500";

    spinnerContainer.appendChild(spinner);
    overlay.appendChild(spinnerContainer);

    document.body.appendChild(overlay);

    // Force reflow to ensure the transition works
    void overlay.offsetWidth;
    overlay.style.opacity = "1";

    // Navigate after a short delay to allow the animation to complete
    setTimeout(async () => {
      await router.push(`/${moviePath}`);
    }, 300);
  };

  // Calculate average rating and optimize with memoization
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
    <Link
      href={`/${moviePath}`}
      draggable={false}
      className={`relative overflow-hidden rounded-xl transition-all duration-300 transform 
        ${isLeaving ? "scale-95 opacity-70" : "hover:translate-y-[-8px]"} 
        hover:shadow-[0_20px_30px_rgba(0,0,0,0.3)] cursor-pointer`}
      onClick={handleClick}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onTouchStart={() => isMobile && setIsHovered(true)}
      onTouchEnd={() => isMobile && setTimeout(() => setIsHovered(false), 500)}
    >
      <div className="relative aspect-[2/3] w-full">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-900 rounded-xl animate-pulse"></div>
        )}

        {/* Movie poster */}
        <Image
          className={`w-full h-full object-cover rounded-xl select-none transition-transform duration-300 
            ${isHovered ? "scale-105" : "scale-100"}
            ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          draggable={false}
          width={isMobile ? 300 : 500}
          height={isMobile ? 450 : 750}
          src={optimizedImageUrl}
          alt={title || "Movie poster"}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          style={{ objectPosition: "center" }}
        />

        {/* Permanent gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent rounded-xl"></div>

        {/* Hover overlay - slides up from bottom */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent transition-all duration-300 rounded-xl 
            ${isHovered ? "opacity-100" : "opacity-0"}`}
        ></div>

        {/* Content container */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-5">
          {/* Static content - always visible */}
          <div className="z-10">
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
          <div>
            <div
              className={`transition-all duration-300 ease-out transform 
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
                    <AiOutlineComment
                      className="text-blue-300 mr-1"
                      size={16}
                    />
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
    </Link>
  );
});

export default Movie;
