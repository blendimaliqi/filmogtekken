import { client, urlFor } from "@/config/client";
import Head from "next/head";
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
    <>
      <Head>
        <title>{movie.title}</title>
      </Head>
      <div
        className="
        flex flex-col items-center
        lg:items-start
        mt-64
        p-24
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
          text-5xl
          lg:text-7xl
          font-bold
          text-center
          lg:text-start
  "
        >
          {movie.title}
        </h1>

        <div
          className="flex flex-col  lg:flex-row items-center lg:items-start sm:space-x-5
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

          <div className=" z-50 flex flex-col items-center lg:items-start justify-center">
            <div
              className="
              flex 
              flex-col 
              sm:flex-col 
              md:flex-row 
              items-center 
              justify-center 
              lg:justify-normal 
              mt-10
              text-gray-400
              md:space-x-5
              space-y-5
              md:space-y-0
              text-3xl
              my-5
        "
            >
              <p>{new Date(movie.releaseDate).getFullYear()}</p>
              <p className="my-5">{movie.length}min</p>
              {movie.ratings && (
                <div className="flex flex-col sm:flex-row items-center justify-center ">
                  <div className="flex flex-row items-center justify-center ">
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
                </div>
              )}
              {!movie.ratings && (
                <p className="text-3xl text-start whitespace-nowrap">
                  Ingen rating enda
                </p>
              )}
              <div className="flex flex-col items-center justify-center w-full sm:flex-row">
                <a
                  href={`https://filmogtekken.sanity.studio/desk/movie;${movie._id}`}
                  target="_blank"
                  className="bg-gray-800 rounded-xl   text-center text-white text-lg font-semibold p-2
                "
                >
                  Rate it!
                </a>
              </div>
            </div>
            <div
              className="flex flex-col  items-center justify-center lg:justify-center lg:items-start 
        
          "
            >
              <div className="flex flex-col  md:flex-row text-center">
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

              <div className=" mt-4 sm:w-3/4 ">
                <p>{movie.plot}</p>
              </div>
            </div>
            <div className="mt-10 text-3xl text-center lg:text-start flex flex-col ">
              {movie.ratings && <h1>Individuell rating</h1>}
              <div
                className="flex flex-row justify-center lg:justify-start
            flex-wrap
            "
              >
                {movie.ratings &&
                  movie.ratings.map((rating: any) => (
                    <div
                      key={rating}
                      className="flex flex-row items-center mt-5"
                    >
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
    </>
  );
}

export default SingleMovie;
