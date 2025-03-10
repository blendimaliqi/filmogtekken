import React from "react";
import Image from "next/image";
import { urlFor } from "@/config/client";
import { Movie, SanityImage } from "@/typings";

interface MoviePosterProps {
  movieData: Movie;
}

function MoviePoster({ movieData }: MoviePosterProps) {
  // Helper function to safely get image URL from different formats
  const getImageUrl = (image: SanityImage | string | undefined | null) => {
    if (!image) return null;

    if (typeof image === "string") return image;

    if (image.url) return image.url;

    return urlFor(image).url();
  };

  return (
    <div className="flex-shrink-0 flex flex-col gap-4">
      {movieData._createdAt && (
        <div className="text-gray-400 text-sm">
          Lagt til{" "}
          {new Date(movieData._createdAt).toLocaleDateString("no-NO", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      )}
      {movieData.poster ? (
        <Image
          width={300}
          height={450}
          src={getImageUrl(movieData.poster) || "/notfound.png"}
          alt={movieData.title || "Movie poster"}
          className="rounded-xl shadow-2xl"
          priority
        />
      ) : (
        <div className="w-[300px] h-[450px] bg-gray-800 rounded-xl flex items-center justify-center">
          <span className="text-gray-500">No poster available</span>
        </div>
      )}
    </div>
  );
}

export default MoviePoster;
