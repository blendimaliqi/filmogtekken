import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import HomepageImage from "@/components/HomepageImage";
import MovieTitle from "@/components/MovieTitle";
import Movies from "@/components/Movies";
import { client, urlFor } from "../config/client";
import { ColorRing, Puff } from "react-loader-spinner";
import { useQuery } from "react-query";

const movieQuery = `*[_type == "movie"] {
  _id,
  title,
  releaseDate,
  poster,
  poster_backdrop,
  plot,
  genres,
  castMembers,
  _createdAt,
  length,
  ratings[] {
    person-> {
      name,
      image
    },
    rating
  }}`;

export const centerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
};

export default function Home() {
  const { isLoading, error, data } = useQuery({
    queryKey: ["movies"],
    queryFn: () => client.fetch(movieQuery),
    staleTime: 5000,
    cacheTime: 60000,
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

  const sortedMovies = data.sort((a: any, b: any) => {
    return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime();
  });

  const moviesToDisplay = sortedMovies.slice(0, 5);

  console.log(data);

  return (
    <main>
      <Carousel
        className="hidden sm:block "
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
            movie={movie}
          >
            <MovieTitle movie={movie} />
          </HomepageImage>
        ))}
      </Carousel>

      <Movies movies={sortedMovies} />
    </main>
  );
}

// export async function getStaticProps() {
//   const movieData = await client.fetch(movieQuery);
//   return {
//     props: {
//       movies: movieData,
//     },
//     //revalidate after 30 seconds
//     revalidate: 30,
//   };
// }
