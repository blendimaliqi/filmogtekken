import { client, urlFor } from "@/config/client";
import Image from "next/image";
import { useRouter } from "next/router";
import { AiFillStar } from "react-icons/ai";

type Props = {
  children: React.ReactNode;
  url: string;
  movie: any;
};

const movieQuery = `*[_type == "movie" && _id == $movieId] {
  _id,
  title,
  releaseDate,
  poster,
  poster_backdrop,
  plot,
  genres,
  castMembers,
  ratings[] {
    person-> {
      name,
      image
    },
    rating
  },
  length
}[0]`;

function SingleMovie({ movie }: Props) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  console.log("BACKDROP", movie.poster_backdrop.asset);

  return (
    <div
      className="
        flex flex-col items-start
        justify-end
        p-24
        w-full h-screen
    "
    >
      <Image
        src={urlFor(movie.poster_backdrop.asset).url()}
        height={0}
        width={0}
        sizes="100vh"
        alt="background"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "80%",
          opacity: 0.3,
        }}
      />
      <h1
      style={{zIndex: 90}}
        className="
        text-7xl font-bold
        text-white
        whitespace-nowrap
      "
      >
        {movie.title}
      </h1>
      <div className="flex flex-row items-start space-x-5">
        <Image
          width={240}
          height={240}
          src={urlFor(movie.poster).url()}
          alt={movie.title}
          style={{zIndex: 90}}
          className="
        mt-10
        rounded-3xl
        "
        />
        <div style={{zIndex:90}}>
          <div
            className="flex flex-row items-center mt-10
        text-gray-400
        space-x-5
        // font size
        text-3xl
        "
          >
            <p>{new Date(movie.releaseDate).getFullYear()}</p>
            <p>{movie.length}min</p>
            {movie.ratings ? (
              <div className="flex flex-row items-center">
                <p>
                  {(
                    movie.ratings.reduce(
                      (acc: number, curr: any) => acc + curr.rating,
                      0
                    ) / movie.ratings.length
                  ).toFixed(2)}
                </p>
                <AiFillStar />
                <p className="ml-2">
                  {" "}
                  ({movie.ratings.length}{" "}
                  {movie.ratings.length === 1 ? "rating" : "ratings"})
                </p>
                <a href={`https://filmogtekken.sanity.studio/desk/movie;${movie._id}`} target="_blank" className="bg-gray-800 ml-2 p-1 rounded-xl w-20 text-center text-white text-lg font-semibold
                hover:bg-gray-500
                ">Rate it!</a>
              </div>
            ) : (
              <p>Ingen rating enda</p>
            )}
          </div>
          <div className="flex flex-row mt-4">
            {movie.genres &&
              movie.genres.map((genre: string) => (
                <p
                  className="mr-4 text-2xl font-light border 
                  rounded-lg p-2
                "
                  key={genre}
                >
                  {genre}
                </p>
              ))}
          </div>
          <div className="mt-4">
            <p>{movie.plot}</p>
          </div>
          <div className="mt-10 text-3xl flex flex-col">
            {movie.ratings && <h1>Individuell rating</h1>}
            <div
              className="flex flex-row space-x-10 w-2/3 
            flex-wrap
            "
            >
              {movie.ratings &&
                movie.ratings.map((rating: any) => (
                  <div
                    key={rating}
                    className="flex flex-row items-center space-x-5 mt-5"
                  >
                    <Image
                      width={70}
                      height={70}
                      src={urlFor(rating.person.image.asset).url()}
                      alt={rating.person.name}
                      className="rounded-full w-30 h-30 object-cover"
                      style={{ width: "70px", height: "70px" }}
                    />

                    <div className="flex flex-col">
                      <p>{rating.person.name}</p>
                      <div className="flex flex-row items-center">
                        <p>{rating.rating}</p>
                        <AiFillStar />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SingleMovie;

export async function getStaticProps({ params }: any) {
  const { slug } = params;
  const movieData = await client.fetch(movieQuery, { movieId: slug });
  return {
    props: {
      movie: movieData,
    },
    revalidate: 30,
  };
}

export async function getStaticPaths() {
  const movies = await client.fetch(`*[_type == "movie"]`);
  const paths = movies.map((movie: any) => ({ params: { slug: movie._id } }));
  return {
    paths,
    fallback: true,
  };
}
