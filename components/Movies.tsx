//create movies component
import React, { useEffect, useState } from "react";
import Movie, { MovieProps } from "./Movie";
import { client } from "@/config/client";
import { urlFor } from "../config/client";

function Movies(movies: any) {
  // useEffect(() => {
  //   const getMovieRequest = async () => {
  //     const url = `http://www.omdbapi.com/?s=wrong+turn&apikey=62d896b5`;

  //     const response = await fetch(url);
  //     const responseJson = await response.json();

  //     setMovies(responseJson.Search);
  //   };

  //   getMovieRequest();
  //   console.timeLog("getMovieRequest", movies);
  // }, []);

  return (
    <div className="">
      <div
        className="
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
        2xl:grid-cols-6
        gap-4
        p-10
        sm:px-8
        md:px-16
        lg:px-20
        xl:px-32
        2xl:px-40
        w-full
        h-full
        justify-items-center
        items-center
        text-gray-800
        text-xl
      "
      >
        <button
          className="text-gray-300
        hover:text-gray-400
        transition duration-300 ease-in-out
        cursor-pointer
        //give border when hover
        hover:border-2
        border-gray-300
        rounded-2xl
        hover:border-opacity-50
        p-2
        h-96
        w-full
        "
        >
          Legg til
        </button>
        {movies.movies.map((movie: any) => (
          <Movie
            key={movie.title}
            title={movie.title}
            year={movie.year}
            poster={movie.poster.asset}
          />
        ))}
      </div>
    </div>
  );
}

export default Movies;
