//create movie component
import React, { useEffect } from "react";
import { urlFor } from "../config/client";
import Image from "next/image";
import Link from "next/link";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
  movie: any;
}

function Movie({ title, year, poster, movie }: MovieProps) {
  return (
    <Link
      href={`/${movie._id}`}
      draggable={false}
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
        select-none
      "
          draggable={false}
          
          width={200}
          height={300}
          src={urlFor(poster).url()}
          alt="poster"
        />
      }
    </Link>
  );
}

export default Movie;
