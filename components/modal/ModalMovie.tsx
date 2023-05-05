import React, { useEffect } from "react";
import Image from "next/image";
import { AiFillStar } from "react-icons/ai";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
  id: number;
  movie: any;
}

function ModalMovie({ title, year, poster, id, movie }: MovieProps) {
  const url = `https://image.tmdb.org/t/p/w500/${poster}`;

  return (
    <div className="hover:scale-105 transition duration-200 cursor-pointer">
      {poster ? (
        <div>
          <div className="relative mt-5 rounded-3xl">
            <Image
              className="
              sm:h-96 sm:w-72
              rounded-3xl"
              width={200}
              height={300}
              src={url}
              alt="poster"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-200 bg-black bg-opacity-80">
              <div className="flex flex-col justify-between items-center h-full">
                <span className="text-white font-semibold text-2xl mt-40">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <p className="text-2xl">
                        {movie.vote_average.toFixed(2)}
                      </p>
                      <AiFillStar style={{ marginTop: "4px" }} size={30} />
                    </div>

                    <p className="font-light text-base">
                      {" "}
                      {movie.vote_count} ratings
                    </p>
                  </div>
                </span>
                <span className="text-white text-start font-semibold  p-4">
                  {movie.title}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ModalMovie;
