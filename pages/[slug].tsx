import RatingModal from "@/components/modal/RatingModal";
import { client, urlFor } from "@/config/client";
import { movieQuery } from "@/utils/groqQueries";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import { useQuery } from "@tanstack/react-query";
import { GetStaticProps } from "next";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AiFillStar } from "react-icons/ai";
import { ColorRing } from "react-loader-spinner";
import { Movie } from "../typings";
import CommentForm from "@/components/CommentForm";

const centerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
};

function SingleMovie() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const {
    isLoading,
    error,
    data: movie,
    refetch,
  } = useQuery<Movie>({
    queryKey: ["movie"],
    onError: (error) => {
      refetch();
      console.log(error);
    },
    queryFn: () => client.fetch(movieQuery, { movieId: router.query.slug }),
  });

  if (!movie)
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
  const movieData: Movie = movie;

  if (isLoading || status === "loading")
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

  async function rateMovie(movieId: string, rating: number) {
    try {
      if (session == null || session == undefined) {
        return;
      } else {
        if (session.user == null || session.user == undefined) return;
      }
      const userName = session.user.name;
      const personQuery = `*[_type == "person" && name == "${userName}"]`;
      const [existingPerson] = await client.fetch(personQuery);

      let person: any;

      if (!existingPerson) {
        // Create a new person if not found
        const imageAsset = await uploadExternalImage(session.user.image ?? "");
        const imageAssetId = imageAsset._id;

        const newPerson = {
          _type: "person",
          _id: uuidv4(),
          name: userName,
          image: {
            _type: "image",
            asset: {
              _ref: imageAssetId,
            },
          },
          slug: {
            _type: "slug",
            current: userName?.toLowerCase().replace(/\s+/g, "-"),
          },
        };

        person = await client.create(newPerson);
      } else {
        person = existingPerson;
      }

      const movieQueryWithRating = `*[_type == "movie" && _id == "${movieId}" && defined(ratings)]`;

      const [movieWithRating] = await client.fetch(movieQueryWithRating);

      if (movieWithRating) {
        // Update the existing rating or add a new rating
        const existingRatingIndex = movieWithRating.ratings.findIndex(
          (rating: any) => rating.person._ref === person._id
        );

        if (existingRatingIndex > -1) {
          // Update the existing rating
          const updatedRatings = [...movieWithRating.ratings];
          updatedRatings[existingRatingIndex].rating = rating;
          movieWithRating.ratings = updatedRatings;
        } else {
          // Create a new rating
          const newRating = {
            _key: uuidv4(),
            person: { _type: "reference", _ref: person._id },
            rating: rating,
          };
          movieWithRating.ratings.push(newRating);
        }

        const updatedMovie = await client
          .patch(movieId)
          .set({ ratings: movieWithRating.ratings })
          .commit();
      } else {
        const newRating = {
          _key: uuidv4(),
          person: { _type: "reference", _ref: person._id },
          rating: rating,
        };

        // Add the new rating to the movie ratings array
        const updatedMovie = await client
          .patch(movieId)
          .setIfMissing({ ratings: [] }) // Create the ratings array if it doesn't exist
          .append("ratings", [newRating]) // Wrap the new rating inside an array
          .commit();
      }
      refetch();
    } catch (error) {
      console.error("Error updating movie rating:", error);
    }
  }

  return (
    <main className="    ">
      <Head>
        <title>{movieData.title ?? ""}</title>
      </Head>
      <div className="flex flex-col items-center lg:items-start mt-60 p-24 no-drag">
        <Image
          src={urlFor(movieData.poster_backdrop.asset).url()}
          height={0}
          width={0}
          sizes="100vh"
          alt="background"
          className="draggable select-none object-cover"
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
            background: "linear-gradient(to bottom, transparent 40%, #000000)",
          }}
        />
        <h1
          style={{ zIndex: 90 }}
          className="text-5xl lg:text-7xl font-bold text-center lg:text-start"
        >
          {movieData.title}
        </h1>
        <div className="flex flex-col lg:flex-row items-center lg:items-start sm:space-x-5">
          <Image
            width={240}
            height={240}
            src={urlFor(movieData.poster).url()}
            alt={movieData.title}
            style={{ zIndex: 90 }}
            className="mt-10 rounded-3xl no-drag"
          />
          <div className="z-50 flex flex-col items-center lg:items-start justify-center">
            <RatingModal
              open={open}
              setOpen={setOpen}
              rateMovie={rateMovie}
              movieId={movieData._id ?? ""}
            />
            <div className="flex flex-col sm:flex-col md:flex-row items-center justify-center lg:justify-normal mt-10 text-gray-400 md:space-x-5 space-y-5 md:space-y-0 text-3xl my-5">
              <p>{new Date(movieData.releaseDate ?? "").getFullYear()}</p>
              <p className="my-5">{movieData.length}min</p>
              {movieData.ratings && (
                <div className="flex flex-col sm:flex-row items-center justify-center">
                  <div className="flex flex-row items-center justify-center">
                    <p>
                      {(
                        movieData.ratings.reduce(
                          (acc: number, curr: any) => acc + curr.rating,
                          0
                        ) / movieData.ratings.length
                      ).toFixed(2)}
                    </p>
                    <AiFillStar />
                    <p className="ml-2 whitespace-nowrap">
                      ({movieData.ratings.length}{" "}
                      {movieData.ratings.length === 1 ? "rating" : "ratings"})
                    </p>
                  </div>
                </div>
              )}
              {!movieData.ratings && (
                <p className="text-3xl text-center whitespace-nowrap">
                  Ingen rating enda
                </p>
              )}
              <div className="flex flex-col items-center justify-center w-full sm:flex-row">
                {session ? (
                  <button
                    className="bg-yellow-700 rounded-xl w-full text-center text-white text-lg font-semibold py-2 px-4 hover:bg-yellow-600 flex items-center justify-center gap-1"
                    onClick={() => setOpen(!open)}
                  >
                    <AiFillStar /> Rate
                  </button>
                ) : (
                  <button
                    className="bg-yellow-700 rounded-xl w-full text-center text-white text-lg font-semibold py-2 px-4 hover:bg-yellow-600 flex items-center justify-center gap-1"
                    onClick={() => {
                      signIn();
                    }}
                  >
                    <AiFillStar /> Logg inn for å rate
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center lg:justify-center lg:items-start">
              <div className="flex flex-col md:flex-row text-center">
                {movieData.genres &&
                  movieData.genres.map((genre: string, index) => (
                    <p
                      className="md:mr-4 text-2xl font-light border rounded-lg p-2 mt-2 mb-2"
                      style={{ zIndex: 90 }}
                      key={uuidv4()}
                    >
                      <p>{genre}</p>
                    </p>
                  ))}
              </div>
              <div className="mt-4 sm:w-3/4">
                <p>{movieData.plot}</p>
              </div>
            </div>
            <div className="mt-10 text-3xl text-center lg:text-start flex flex-col w-full">
              {movieData.ratings && <h1>Individuell rating</h1>}
              <div className="flex flex-row justify-center lg:justify-start flex-wrap md:flex-nowrap">
                {movieData.ratings &&
                  movieData.ratings.map((rating: any) => (
                    <div
                      key={uuidv4()}
                      className="flex flex-row items-center mt-5"
                    >
                      {rating.person.image.asset && (
                        <Image
                          width={70}
                          height={70}
                          src={urlFor(rating.person.image.asset).url()}
                          alt={rating.person.name ?? "Ukjent"}
                          className="rounded-full w-30 h-30 object-cover"
                          style={{ width: "70px", height: "70px" }}
                        />
                      )}
                      <div className="flex flex-col mr-10 ml-5">
                        <p>{rating.person.name}</p>
                        <div className="flex flex-row items-center">
                          <p>{rating.rating}</p>
                          <AiFillStar />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="">
                <CommentForm
                  refetch={refetch}
                  movieData={movieData}
                  movieId={movieData._id}
                  session={session}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SingleMovie;
