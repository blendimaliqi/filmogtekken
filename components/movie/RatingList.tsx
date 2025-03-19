import React, { useEffect, useState, useCallback } from "react";
import RatingItem from "./RatingItem";

interface RatingListProps {
  ratings: any[] | null;
}

function RatingList({ ratings }: RatingListProps) {
  // Add a state to force re-renders when rating data changes
  const [renderKey, setRenderKey] = useState(Date.now());
  const [processedRatings, setProcessedRatings] = useState<any[]>([]);

  // Process ratings whenever they change
  useEffect(() => {
    if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
      setProcessedRatings([]);
      return;
    }

    // Create a stable copy of the ratings for rendering
    const stableRatings = [...ratings].map((rating) => ({
      ...rating,
      // Ensure each rating has a stable key
      _stableKey:
        rating._key || `rating-${rating.person?._id || Math.random()}`,
    }));

    setProcessedRatings(stableRatings);
    setRenderKey(Date.now());
  }, [ratings]);

  // If no ratings, show empty state
  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
    return (
      <div className="mt-0 mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">
          Individuell Rating
        </h2>
        <p className="text-gray-400">
          Ingen rangeringer ennå. Bli den første til å rangere denne filmen!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-0 mb-12" key={renderKey}>
      <h2 className="text-2xl font-bold text-white mb-6">Individuell Rating</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {processedRatings.map((rating: any, index: number) => (
          <RatingItem
            key={`${rating._stableKey}-${renderKey}`}
            rating={rating}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default RatingList;
