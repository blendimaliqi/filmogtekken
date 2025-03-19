import React, { useState, useEffect } from "react";
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
  // Keep a local state cache of the calculated rating to prevent flicker
  const [cachedRating, setCachedRating] = useState<string | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [forceUpdateKey, setForceUpdateKey] = useState<number>(Date.now());

  // Force update function to use when needed
  const forceUpdate = () => {
    setForceUpdateKey(Date.now());
  };

  // Listen for updates from parent
  useEffect(() => {
    // Whenever movieData changes (especially ratings), force a full recalculation
    if (movieData && movieData.ratings) {
      forceUpdate();
    }
  }, [movieData?._id, JSON.stringify(movieData?.ratings)]);

  // Recalculate rating when data changes
  useEffect(() => {
    if (!movieData?.ratings) return;

    try {
      const ratings = movieData.ratings || [];
      if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
        // Only reset to null if we don't already have a rating
        if (cachedRating !== null && ratings.length === 0) {
          setCachedRating(null);
          setRatingCount(0);
        }
        return;
      }

      let validRatings = 0;
      const sum = ratings.reduce((acc, curr) => {
        // Handle different rating formats
        let ratingValue = 0;

        // Direct number value
        if (typeof curr === "number") {
          ratingValue = curr;
          validRatings++;
        }
        // Object with rating property
        else if (curr && typeof curr === "object") {
          const rating = curr.rating;
          if (
            typeof rating === "number" ||
            (typeof rating === "string" && !isNaN(Number(rating)))
          ) {
            ratingValue = Number(rating);
            validRatings++;
          }
        }

        return acc + ratingValue;
      }, 0);

      // Calculate new average
      const newAverage =
        validRatings > 0 ? (sum / validRatings).toFixed(1) : null;

      // Always update cached values to ensure fresh data
      setCachedRating(newAverage);
      setRatingCount(ratings.length);
    } catch (error) {
      console.error("Error calculating rating:", error);
    }
  }, [movieData, forceUpdateKey]);

  // Use cached rating if available
  const averageRating = cachedRating;

  return (
    <div className="flex-1 text-white" key={forceUpdateKey}>
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
              ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
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
