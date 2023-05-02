import Nav from "@/components/Nav";
import HomepageImage from "@/components/HomepageImage";
import MovieTitle from "@/components/MovieTitle";
import Movies from "@/components/Movies";
import { client, urlFor } from "../config/client";


const movieQuery = `*[_type == "movie"] {
  _id,
  title,
  releaseDate,
  poster,
  castMembers
}`;

export default function Home({ movies }: any) {
  return (
    <main>
      <HomepageImage url={urlFor(movies[0]?.poster.asset).url()}>
        <Nav />
        <MovieTitle movie={movies[0]} />
      </HomepageImage>
      <Movies movies={movies} />
    </main>
  );
}

export async function getStaticProps() {
  const movieData = await client.fetch(movieQuery);
  return {
    props: {
      movies: movieData,
    },
    revalidate: 1,
  };
}
