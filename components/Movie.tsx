import React, { useState } from "react";
import { useRouter } from "next/router";
import { urlFor } from "../config/client";
import Image from "next/image";
import Link from "next/link";
import { AiFillStar, AiOutlineComment } from "react-icons/ai";
import { ColorRing } from "react-loader-spinner";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
  movie: any;
}

function Movie({ title, poster, movie }: MovieProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get the correct URL path
  const moviePath = movie.slug?.current || movie._id;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await router.push(`/${moviePath}`);
    setIsLoading(false);
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

  return (
    <Link
      href={`/${moviePath}`}
      draggable={false}
      className="relative overflow-hidden rounded-xl transition-all duration-300 transform hover:translate-y-[-8px] hover:shadow-[0_20px_30px_rgba(0,0,0,0.3)] cursor-pointer"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50 rounded-xl">
          <ColorRing
            visible={true}
            height="80"
            width="80"
            ariaLabel="blocks-loading"
            wrapperStyle={{}}
            wrapperClass="blocks-wrapper"
            colors={["#cacaca", "#cacaca", "#cacaca", "#cacaca", "#cacaca"]}
          />
        </div>
      )}

      <div className="relative aspect-[2/3] w-full">
        {/* Movie poster */}
        <Image
          className="w-full h-full object-cover rounded-xl select-none"
          draggable={false}
          width={500}
          height={750}
          src={urlFor(poster).url()}
          alt={title || "Movie poster"}
          style={{ objectPosition: "center" }}
        />

        {/* Permanent gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent rounded-xl"></div>

        {/* Hover overlay - slides up from bottom */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent transition-opacity duration-300 rounded-xl ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        ></div>

        {/* Content container */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          {/* Static content - always visible */}
          <div className="z-10">
            <h3 className="text-white font-bold text-xl md:text-2xl line-clamp-2 drop-shadow-lg">
              {title}
            </h3>
            {movie.releaseDate && (
              <p className="text-gray-300 text-sm md:text-base drop-shadow-md mt-1 mb-2">
                {movie.releaseDate.split("-")[0]}
              </p>
            )}
          </div>

          {/* Dynamic content - appears on hover with fade in transition */}
          <div>
            <div
              className={`transition-opacity duration-300 ease-out ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Rating and comments */}
              <div className="flex items-center space-x-3 mt-2 mb-4">
                {averageRating && (
                  <div className="flex items-center">
                    <AiFillStar className="text-yellow-400 mr-1" size={20} />
                    <span className="text-white font-bold">
                      {averageRating}
                    </span>
                  </div>
                )}

                {commentCount > 0 && (
                  <div className="flex items-center">
                    <AiOutlineComment
                      className="text-blue-300 mr-1"
                      size={20}
                    />
                    <span className="text-white font-bold">{commentCount}</span>
                  </div>
                )}
              </div>

              {/* Genres if available */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {movie.genres
                    .slice(0, 2)
                    .map((genre: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs text-white/80 bg-white/10 px-2 py-0.5 rounded-full"
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
}

export default Movie;
