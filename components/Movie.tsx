import React, { useState } from "react";
import { useRouter } from "next/router";
import { urlFor } from "../config/client";
import Image from "next/image";
import Link from "next/link";
import { AiFillStar, AiOutlineComment } from "react-icons/ai";
import { ColorRing } from "react-loader-spinner";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
  movie: any;
}

function Movie({ title, poster, movie }: MovieProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await router.push(`/${movie._id}`);
    setIsLoading(false);
  };

  return (
    <Link
      href={`/${movie._id}`}
      draggable={false}
      className="group hover:opacity-75 transition ease-in-out duration-150 transform hover:scale-105 rounded-xl cursor-pointer relative"
      onClick={handleClick}
    >
      <div className="relative">
        <Image
          className="h-96 w-96 mt-5 rounded-3xl select-none object-cover"
          draggable={false}
          width={200}
          height={300}
          src={urlFor(poster).url()}
          alt="poster"
        />

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-80 transition-opacity duration-200 rounded-3xl"></div>

        <div className="absolute bottom-0 left-0 w-full bg-opacity-0 text-start p-4 opacity-0 group-hover:bg-opacity-50 group-hover:opacity-100 transition-opacity duration-200">
          {movie.title && (
            <h3 className="text-white font-semibold text-xl">{title}</h3>
          )}
          {movie.releaseDate && (
            <p className="text-white font-light">
              {movie.releaseDate.split("-")[0]}
            </p>
          )}
        </div>

        <div className="absolute inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="text-center">
            <h3 className="text-white font-semibold text-4xl z-40 group-hover:drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] transition-all duration-200">
              {movie.ratings && movie.ratings.length > 0 ? (
                <div className="flex items-center">
                  {(
                    movie.ratings.reduce(
                      (acc: any, curr: any) => acc + curr.rating,
                      0
                    ) / movie.ratings.length
                  ).toFixed(2)}
                  <AiFillStar style={{ marginTop: "4px" }} size={30} />
                </div>
              ) : (
                "Ingen rating"
              )}
              {movie.comments != null && (
                <div className="flex items-center justify-center">
                  <AiOutlineComment
                    style={{ marginTop: "8px", marginRight: "6px" }}
                    size={30}
                  />
                </div>
              )}
            </h3>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 rounded-3xl">
          <ColorRing
            visible={true}
            height="80"
            width="80"
            ariaLabel="blocks-loading"
            wrapperStyle={{}}
            wrapperClass="blocks-wrapper"
            colors={["#cacaca", "#cacaca", "#cacaca", "#cacaca", "#cacaca"]}
          />
        </div>
      )}
    </Link>
  );
}

export default Movie;
