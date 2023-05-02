import Image from "next/image";
import { Inter } from "next/font/google";
import Nav from "@/components/Nav";
import HomepageImage from "@/components/HomepageImage";
import MovieTitle from "@/components/MovieTitle";
import Movies from "@/components/Movies";
import { useEffect, useState } from "react";
import {client} from "../config/client"
import movie from '@/studio/schemas/movie';

export default function Home() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    client
      .fetch('*[_type == "movie"]{ title, releaseDate, poster }')
      .then((data: any) => {
        setMovies(data);
        console.log("DATAA", data);
      });
  }, []);
  return (
    <main>
      <HomepageImage>
        <Nav />
        <MovieTitle />
      </HomepageImage>
      <Movies movies={movies}/>
    </main>
  );
}
