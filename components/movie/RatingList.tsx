import React from "react";
import RatingItem from "./RatingItem";

interface RatingListProps {
  ratings: any[] | null;
}

function RatingList({ ratings }: RatingListProps) {
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
    <div className="mt-0 mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">Individuell Rating</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {ratings.map((rating: any, index: number) => (
          <RatingItem
            key={rating._key || `rating-${index}`}
            rating={rating}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default RatingList;
