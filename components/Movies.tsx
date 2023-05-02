//create movies component
import React, { useEffect, useState } from "react";
import Movie, { MovieProps } from "./Movie";
import { client, createPost } from "@/config/client";
import { urlFor } from "../config/client";

export async function uploadExternalImage(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const contentType = response.headers.get("content-type") || "image/jpeg"; // Provide a default value

  const asset = await client.assets.upload("image", blob, { contentType });
  return asset;
}

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

  async function addMovie() {
    const imageUrl =
      "https://image.tmdb.org/t/p/original//hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg";
    const imageAsset = await uploadExternalImage(imageUrl);
    const imageAssetId = imageAsset._id;

    const movieData = {
      _type: "movie",
      title: "Example Movie",
      releaseDate: "2023-01-01T00:00:00Z",
      poster: {
        _type: "image",
        asset: {
          _ref: imageAssetId,
          _type: "reference",
        },
      },
    };
    const createdMovie = await createPost(movieData);
    console.log("Created movie:", createdMovie);
  }

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
          onClick={addMovie}
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
