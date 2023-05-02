//create movies component
import React, { useEffect, useState } from "react";
import Movie, { MovieProps } from "./Movie";

function Movies() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const getMovieRequest = async () => {
      const url = `http://www.omdbapi.com/?s=wrong+turn&apikey=62d896b5`;

      const response = await fetch(url);
      const responseJson = await response.json();

      setMovies(responseJson.Search);
    };

    getMovieRequest();
    console.timeLog("getMovieRequest", movies);
  }, []);

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
        {movies &&
          movies.map((movie: any) => (
            <Movie
              key={movie.imdbID}
              title={movie.Title}
              year={movie.Year}
              poster={movie.Poster}
            />
          ))}
      </div>
    </div>
  );
}

export default Movies;
