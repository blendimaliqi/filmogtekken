//create movie component
import React, { useEffect } from "react";

import Image from "next/image";
import { urlFor } from "@/config/client";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
}
function ModalMovie({ title, year, poster }: MovieProps) {
  console.log("POSTER", poster);

  const isValidUrl = (url: string) =>
    url.startsWith("/") ||
    url.startsWith("http://") ||
    url.startsWith("https://");

  const handleOnError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    event.currentTarget.src = "/static/default-image.jpg"; // Replace with your default image path
  };

  return (
    <div
      className="
        hover:opacity-75
        transition ease-in-out duration-150
        transform hover:scale-105
        cursor-pointer
      "
    >
      {isValidUrl(poster) && (
        <Image
          className="
          h-72 w-64
          mt-5
          rounded-3xl
        "
          width={200}
          height={300}
          src={poster}
          alt="poster"
          onError={handleOnError}
        />
      )}
    </div>
  );
}

export default ModalMovie;