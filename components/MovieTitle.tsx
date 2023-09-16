import Link from "next/link";
import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import { uuidv4 } from "@/utils/helperFunctions";

function MovieTitle(movie: any) {
  return (
    <div
      className="flex flex-col items-start justify-center h-full mt-16 md:mt-52 p-24 z-10000"
      style={{ zIndex: "100" }}
    >
      <h1 className="text-2xl md:text-6xl lg:text-8xl text-left font-bold text-white py-8 z-9000">
        {movie.movie.title}
      </h1>
      {movie.movie.ratings && (
        <div className="flex items-center">
          <p className="text-lg md:text-2xl font-light text-white mt-4 flex items-center flex-row gap-2">
            {(
              movie.movie.ratings.reduce(
                (acc: any, curr: any) => acc + curr.rating,
                0
              ) / movie.movie.ratings.length
            ).toFixed(2)}
            <AiFillStar style={{ marginTop: "4px" }} size={25} />
          </p>
        </div>
      )}
      <div className="flex">
        {movie.movie.genres &&
          movie.movie.genres.map((genre: string) => (
            <div
              className="flex flex-wrap text-lg md:text-2xl font-light"
              key={uuidv4()}
            >
              <p className="mr-4">{genre}</p>
            </div>
          ))}
      </div>
      <Link
        draggable={false}
        href={`/${movie.movie._id}`}
        className="flex flex-row items-center justify-center bg-gray-500 bg-opacity-30 hover:bg-opacity-20 transition duration-300 ease-in-out cursor-pointer rounded-2xl p-4 w-40 h-10 md:h-16 md:w-auto mt-4"
      >
        <div className="flex flex-row items-center justify-center gap-4 ">
          <FaInfoCircle size={20} color="white" className="mt-1" />
          <p className="text-base md:text-2xl text-white font-light">
            Sjekk ut filmen
          </p>
        </div>
      </Link>
    </div>
  );
}

export default MovieTitle;
