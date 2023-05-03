import { client, urlFor } from "@/config/client";
import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

type Props = {};

const movieQuery = `*[_type == "movie"] {
  _id,
  title,
  releaseDate,
  poster,
  castMembers
}`;

function Caru({ movies }: any) {
  const images = movies.map((movie: any) => (
    <div key={movie._id}>
      <img src={urlFor(movie.poster.asset).url()} alt={movie.title} />
      <p className="legend">{movie.title}</p>
    </div>
  ));

  return (
    <div className="flex flex-row">
      <Carousel showArrows={true} showThumbs={false}>
        <img src={urlFor(movies[0].poster.asset).url()} alt={movies[0].title} />
        <img src={urlFor(movies[1].poster.asset).url()} alt={movies[1].title} />
        <img src={urlFor(movies[2].poster.asset).url()} alt={movies[2].title} />
      </Carousel>
    </div>
  );
}

export default Caru;

export async function getStaticProps() {
  const movieData = await client.fetch(movieQuery);
  return {
    props: {
      movies: movieData,
    },
    revalidate: 30,
  };
}
