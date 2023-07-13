import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import HomepageImage from "@/components/HomepageImage";
import MovieTitle from "@/components/MovieTitle";
import { client, urlFor } from "../config/client";
import { ColorRing } from "react-loader-spinner";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom } from "jotai";
import Movies from "@/components/Movies";
import { Movie } from "../components/Movies";
import { moviesQuery } from "@/utils/groqQueries";

export const centerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
};

export const moviesAtom = atom<Movie[]>([]);

export default function Home() {
  const [movies, setMovies] = useAtom(moviesAtom);

  const { isLoading, error } = useQuery<Movie[]>({
    queryKey: ["movies"],
    queryFn: () => client.fetch(moviesQuery),
    onSuccess: (data) => setMovies(data),
  });

  if (isLoading)
    return (
      <div style={centerStyle}>
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
    );

  if (error) return "An error has occurred: ";

  const sortedMovies = movies.sort((a: any, b: any) => {
    return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime();
  });

  const moviesToDisplay = sortedMovies.slice(0, 5);

  return (
    <main>
      <Carousel
        className="hidden md:block "
        autoPlay={true}
        interval={10000}
        stopOnHover={false}
        infiniteLoop={true}
        showThumbs={false}
        showStatus={false}
      >
        {moviesToDisplay.map((movie: any) => (
          <HomepageImage
            key={movie._id}
            url={urlFor(movie.poster_backdrop.asset).url() ?? ""}
          >
            <MovieTitle movie={movie} />
          </HomepageImage>
        ))}
      </Carousel>
      <Movies />
    </main>
  );
}
