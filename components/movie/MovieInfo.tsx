import React from "react";
import { AiFillStar } from "react-icons/ai";
import { Movie } from "@/typings";
import RatingButton from "./RatingButton";

interface MovieInfoProps {
  movieData: Movie;
  session: any;
  setOpen: (value: boolean) => void;
  open: boolean;
}

function MovieInfo({ movieData, session, setOpen, open }: MovieInfoProps) {
  const calculateAverageRating = (ratings: any[] | null = []) => {
    if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
      return null;
    }

    try {
      const sum = ratings.reduce((acc, curr) => {
        const rating = curr?.rating ? Number(curr.rating) : 0;
        return acc + rating;
      }, 0);
      return (sum / ratings.length).toFixed(1);
    } catch (error) {
      console.error("Error calculating rating:", error);
      return null;
    }
  };

  const averageRating = calculateAverageRating(movieData.ratings);

  return (
    <div className="flex-1 text-white">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
        {movieData.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 mb-6 text-lg text-gray-300">
        {movieData.releaseDate && (
          <div className="flex items-center">
            <span>{new Date(movieData.releaseDate).getFullYear()}</span>
          </div>
        )}

        {movieData.length && (
          <div className="flex items-center">
            <span>{movieData.length} min</span>
          </div>
        )}

        {averageRating && (
          <div className="flex items-center gap-1 bg-yellow-600/80 px-3 py-1 rounded-full">
            <span className="text-white font-medium">{averageRating}</span>
            <AiFillStar className="text-white text-sm" />
            <span className="text-white/90 text-sm ml-1">
              ({movieData.ratings.length}{" "}
              {movieData.ratings.length === 1 ? "rating" : "ratings"})
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {movieData.genres?.map((genre: string) => (
          <span
            key={genre}
            className="px-3 py-1 bg-yellow-600/80 text-white text-sm font-medium rounded-full"
          >
            {genre}
          </span>
        ))}
      </div>

      <p className="text-gray-300 text-lg leading-relaxed mb-8">
        {(() => {
          // First try plot as direct string
          if (
            movieData.plot &&
            typeof movieData.plot === "string" &&
            movieData.plot.trim() !== ""
          ) {
            return movieData.plot;
          }

          // Then try overview structure
          if (
            movieData.overview &&
            typeof movieData.overview === "object" &&
            movieData.overview.children &&
            Array.isArray(movieData.overview.children) &&
            movieData.overview.children.length > 0 &&
            movieData.overview.children[0].text
          ) {
            return movieData.overview.children[0].text;
          }

          // Finally, fallback message
          return "No description available";
        })()}
      </p>

      <RatingButton session={session} setOpen={setOpen} open={open} />
    </div>
  );
}

export default MovieInfo;
