//create movie component
import React, { useEffect } from "react";
import { urlFor } from "../config/client";
import Image from "next/image";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
}

function Movie({ title, year, poster }: MovieProps) {
  return (
    <div
      className="
      hover:opacity-75
      transition ease-in-out duration-150
      transform hover:scale-105
      cursor-pointer
    "
    >
      {
        <Image
          className="
        h-96 w-96
        mt-5
        rounded-3xl
      "
          width={200}
          height={300}
          src={urlFor(poster).url()}
          alt="poster"
        />
      }
    </div>
  );
}

export default Movie;
