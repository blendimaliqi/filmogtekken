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
  const sortedMovies = movies.sort((a: any, b: any) => {
    return (
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
  });

  return (
    <main>
      <HomepageImage  url={urlFor(movies[0]?.poster.asset).url()}>
        <div
          className="
    
          "
        >
          <Nav />
          <MovieTitle movie={movies[0]} />
        </div>
      </HomepageImage>

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
