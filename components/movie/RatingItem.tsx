import React from "react";
import Image from "next/image";
import { AiFillStar } from "react-icons/ai";
import { urlFor } from "@/config/client";
import { SanityImage } from "@/typings";

interface RatingItemProps {
  rating: any;
  index: number;
}

function RatingItem({ rating, index }: RatingItemProps) {
  // Helper function to safely get image URL from different formats
  const getImageUrl = (image: SanityImage | string | undefined | null) => {
    if (!image) return null;

    if (typeof image === "string") return image;

    if (image.url) return image.url;

    return urlFor(image).url();
  };

  const person = typeof rating.person === "object" ? rating.person : null;
  const hasImage = person && person.image;
  const imageUrl = hasImage ? getImageUrl(person.image) : null;

  return (
    <div className="flex items-center gap-4 bg-zinc-900/50 rounded-xl p-4 backdrop-blur-sm border border-zinc-800/50 hover:border-yellow-600/30 transition-all duration-300">
      {imageUrl ? (
        <Image
          width={50}
          height={50}
          src={imageUrl}
          alt={person?.name || "Ukjent"}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="w-[50px] h-[50px] rounded-full bg-zinc-800 flex items-center justify-center">
          <span className="text-zinc-500 text-lg">
            {person && person.name ? person.name.charAt(0).toUpperCase() : "?"}
          </span>
        </div>
      )}
      <div className="flex-1">
        <div className="font-medium mb-1">
          {person ? person.name : "Ukjent bruker"}
        </div>
        <div className="flex items-center">
          <span className="text-yellow-500 mr-1">{rating.rating}</span>
          <AiFillStar className="text-yellow-500 text-sm" />
        </div>
      </div>
    </div>
  );
}

export default RatingItem;
