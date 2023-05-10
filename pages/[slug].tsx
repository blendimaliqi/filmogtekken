import { client, urlFor } from "@/config/client";
import Image from "next/image";
import { useRouter } from "next/router";
import { AiFillStar } from "react-icons/ai";
import { ColorRing } from "react-loader-spinner";
import { useQuery } from "react-query";

const centerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
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

function SingleMovie() {
  const router = useRouter();

  const {
    isLoading,
    error,
    data: movie,
  } = useQuery({
    queryKey: ["movie"],
    queryFn: () => client.fetch(movieQuery, { movieId: router.query.slug }),
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

  return (
    <div
      className="
        flex flex-col items-start
        mt-64
        p-24
        w-screen
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
      <div
        className="absolute top-0 left-0 w-full h-[80%]"
        style={{
          // Set the background color of the pseudo-element to transparent
          // and set its opacity to increase from top to bottom
          background: "linear-gradient(to bottom, transparent 40%, #000000)",
        }}
      />

      <h1
        style={{ zIndex: 90 }}
        className="
        text-4xl
        md:text-7xl font-bold
        text-white
        whitespace
      "
      >
        {movie.title}
      </h1>
      <div
        className="flex flex-col md:flex-row items-start space-x-5
      "
      >
        <Image
          width={240}
          height={240}
          src={urlFor(movie.poster).url()}
          alt={movie.title}
          style={{ zIndex: 90 }}
          className="
        mt-10
        rounded-3xl
        "
        />
        <div style={{ zIndex: 90 }}>
          <div
            className="flex flex-col md:flex-row items-center mt-10
        text-gray-400
        space-x-5
        // font size
        text-3xl
        my-5
        "
          >
            <p>{new Date(movie.releaseDate).getFullYear()}</p>
            <p className="my-5">{movie.length}min</p>
            {movie.ratings ? (
              <div className="flex flex-col md:flex-row items-center justify-center ">
                <div className="flex flex-row items-center ">
                  <p>
                    {(
                      movie.ratings.reduce(
                        (acc: number, curr: any) => acc + curr.rating,
                        0
                      ) / movie.ratings.length
                    ).toFixed(2)}
                  </p>
                  <AiFillStar />
                  <p className="ml-2 whitespace-nowrap">
                    {" "}
                    ({movie.ratings.length}{" "}
                    {movie.ratings.length === 1 ? "rating" : "ratings"})
                  </p>
                </div>
                <div className=" sm:mt-4 md:mt-0 p-2">
                  <a
                    href={`https://filmogtekken.sanity.studio/desk/movie;${movie._id}`}
                    target="_blank"
                    className="bg-gray-800 ml-2 p-2 rounded-xl w-20 text-center text-white text-lg font-semibold
                hover:bg-gray-500
                "
                  >
                    Rate it!
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-row items-center">
                <p>Ingen rating enda</p>
                <a
                  href={`https://filmogtekken.sanity.studio/desk/movie;${movie._id}`}
                  target="_blank"
                  className="bg-gray-800 ml-2 mt-2 p-1 rounded-xl w-20 text-center text-white text-lg font-semibold
                hover:bg-gray-500
                "
                >
                  Rate it!
                </a>
              </div>
            )}
          </div>
          <div
            className="flex flex-row  flex-wrap
          w-2/3
          "
          >
            {movie.genres &&
              movie.genres.map((genre: string) => (
                <p
                  className="mr-4 text-2xl font-light border 
                  rounded-lg p-2 
                  mb-4
                "
                  style={{ zIndex: 90 }}
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
              className="flex flex-row  w-2/3 
            flex-wrap
            "
            >
              {movie.ratings &&
                movie.ratings.map((rating: any) => (
                  <div key={rating} className="flex flex-row items-center mt-5">
                    <Image
                      width={70}
                      height={70}
                      src={urlFor(rating.person.image.asset).url()}
                      alt={rating.person.name}
                      className="rounded-full w-30 h-30 object-cover"
                      style={{
                        width: "70px",
                        height: "70px",
                      }}
                    />

                    <div className="flex flex-col mr-10 ml-5 ">
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
