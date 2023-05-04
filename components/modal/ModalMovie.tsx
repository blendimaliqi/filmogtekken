//create movie component
import React, { useEffect } from "react";
import Image from "next/image";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
  callack?: (movie: any) => void;
  id: number;
}

function ModalMovie({ title, year, poster, callack, id }: MovieProps) {
  const url = `https://image.tmdb.org/t/p/w500/${poster}`;

  return (
    <div
      className="
        hover:opacity-75
        transition ease-in-out duration-150
        transform hover:scale-105
        cursor-pointer
      "
    >
      {poster && (
        <Image
          className="
          h-72 w-64
          mt-5
          rounded-3xl
        "
          onClick={callack}
          width={200}
          height={300}
          src={url}
          alt="poster"
          // onError={handleOnError}
        />
      )}
    </div>
  );
}

export default ModalMovie;
