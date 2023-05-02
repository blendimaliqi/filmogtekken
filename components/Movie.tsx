//create movie component
import React from "react";

export interface MovieProps {
  title: string;
  year: string;
  poster: string;
}

function Movie({ title, year, poster }: MovieProps) {
  return (
    <div className="
    //hover effect and pops out a bit
      hover:opacity-75
      transition ease-in-out duration-150
      transform hover:scale-105
      cursor-pointer


    ">
      <img className="
      //same height and width on my pictures
        h-96 w-96
        mt-5
        rounded-3xl
      " src={poster} alt={title} />

    </div>
  );
}

export default Movie;
