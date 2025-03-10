import React from "react";
import Image from "next/image";
import { urlFor } from "@/config/client";
import { Movie, SanityImage } from "@/typings";
import MoviePoster from "./MoviePoster";
import MovieInfo from "./MovieInfo";

interface MovieHeroProps {
  movieData: Movie;
  contentVisible: boolean;
  session: any;
  setOpen: (value: boolean) => void;
  open: boolean;
}

const MovieHero = ({
  movieData,
  contentVisible,
  session,
  setOpen,
  open,
}: MovieHeroProps) => {
  // Helper function to safely get image URL from different formats
  const getImageUrl = (image: SanityImage | string | undefined | null) => {
    if (!image) return "/notfound.png";

    if (typeof image === "string") return image;

    if (image.url) return image.url;

    return urlFor(image).url();
  };

  return (
    <div className="relative">
      {/* Backdrop image */}
      <div className="absolute inset-0 h-[100vh]">
        <Image
          src={
            getImageUrl(movieData.poster_backdrop) ||
            getImageUrl(movieData.poster)
          }
          alt={movieData.title || "Movie backdrop"}
          priority
          fill
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black" />
      </div>

      {/* Movie content */}
      <div
        className={`relative pt-80 pb-40 px-4 md:px-8 lg:px-16 transition-opacity duration-700 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Movie poster */}
            <MoviePoster movieData={movieData} />

            {/* Movie info */}
            <MovieInfo
              movieData={movieData}
              session={session}
              setOpen={setOpen}
              open={open}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieHero;
