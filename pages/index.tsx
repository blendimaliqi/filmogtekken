import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import HomepageImage from "@/components/HomepageImage";
import MovieTitle from "@/components/MovieTitle";
import Movies from "@/components/Movies";
import Nav from "@/components/Nav";
import { client, urlFor } from "../config/client";

const movieQuery = `*[_type == "movie"] {
  _id,
  title,
  releaseDate,
  poster,
  castMembers
}`;

export default function Home({ movies }: any) {
  const sortedMovies = movies.sort((a: any, b: any) => {
    return (
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
  });

  const moviesToDisplay = sortedMovies.slice(0, 5);

  return (
    <main style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: "0", left: "0", zIndex: "2" }}>
        <Nav />
      </div>
      <Carousel
        autoPlay={true}
        interval={5000}
        stopOnHover={false}
        infiniteLoop={true}
        showThumbs={false}
        showStatus={false}
      >
        {moviesToDisplay.map((movie: any) => (
          <HomepageImage
            key={movie._id}
            url={urlFor(movie.poster.asset).url()}
            movie={movie}
          >
            <div >
            <MovieTitle movie={movie} />
            </div>
          </HomepageImage>
        ))}
      </Carousel>

      <Movies movies={sortedMovies} />
    </main>
  );
}

export async function getStaticProps() {
  const movieData = await client.fetch(movieQuery);
  return {
    props: {
      movies: movieData,
    },
    //revalidate after 30 seconds
    revalidate: 30,
  };
}
