import RatingModal from "@/components/modal/RatingModal";
import { client, clientWithToken, urlFor } from "@/config/client";
import { movieQuery } from "@/utils/groqQueries";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { AiFillStar } from "react-icons/ai";
import { ColorRing } from "react-loader-spinner";
import { Movie } from "../typings";
import CommentForm from "@/components/CommentForm";
import { GetServerSideProps } from "next";

const centerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params!;
  const movie = await client.fetch(movieQuery, { movieId: slug });

  return {
    props: {
      initialMovieData: movie || null,
    },
  };
};

function SingleMovie({ initialMovieData }: { initialMovieData: Movie | null }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const {
    isLoading,
    error,
    data: movie,
    refetch,
  }: UseQueryResult<Movie, Error> = useQuery({
    queryKey: ["movie", router.query.slug],
    initialData: initialMovieData,
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

        person = await clientWithToken.create(newPerson);
      } else {
        person = existingPerson;
      }

      const movieQueryWithRating = `*[_type == "movie" && _id == "${movieId}" && defined(ratings)]`;

      const [movieWithRating] = await client.fetch(movieQueryWithRating);

      if (movieWithRating) {
        const existingRatingIndex = movieWithRating.ratings.findIndex(
          (rating: any) => rating.person._ref === person._id
        );

        if (existingRatingIndex > -1) {
          const updatedRatings = [...movieWithRating.ratings];
          updatedRatings[existingRatingIndex].rating = rating;
          movieWithRating.ratings = updatedRatings;
        } else {
          const newRating = {
            _key: uuidv4(),
            person: { _type: "reference", _ref: person._id },
            rating: rating,
          };
          movieWithRating.ratings.push(newRating);
        }

        const updatedMovie = await clientWithToken
          .patch(movieId)
          .set({ ratings: movieWithRating.ratings })
          .commit();
      } else {
        const newRating = {
          _key: uuidv4(),
          person: { _type: "reference", _ref: person._id },
          rating: rating,
        };

        const updatedMovie = await clientWithToken
          .patch(movieId)
          .setIfMissing({ ratings: [] })
          .append("ratings", [newRating])
          .commit();
      }
      refetch();
    } catch (error) {
      console.error("Error updating movie rating:", error);
    }
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <Head>
        <title>{movieData.title ?? ""}</title>
      </Head>

      {/* Hero section with backdrop */}
      <div className="relative w-full h-[70vh]">
        {/* Movie backdrop */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={urlFor(movieData.poster_backdrop.asset).url()}
            alt="Movie backdrop"
            fill
            priority
            className="object-cover opacity-80"
          />
          {/* Gradient overlays for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 via-gray-900/30 to-transparent" />
        </div>

        {/* Content container */}
        <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Movie poster */}
            <div className="hidden md:block w-64 h-96 flex-shrink-0 -mb-32 shadow-2xl rounded-xl overflow-hidden border-4 border-gray-900">
              <Image
                width={256}
                height={384}
                src={urlFor(movieData.poster).url()}
                alt={movieData.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Movie info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">{movieData.title}</h1>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-400 mt-4">
                {movieData.releaseDate && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(movieData.releaseDate ?? "").getFullYear()}</span>
                  </div>
                )}
                
                {movieData.length && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{movieData.length} min</span>
                  </div>
                )}
                
                {movieData.ratings && movieData.ratings.length > 0 && (
                  <div className="flex items-center">
                    <AiFillStar className="text-yellow-500 mr-1" />
                    <span>
                      {(
                        movieData.ratings.reduce(
                          (acc: number, curr: any) => acc + curr.rating,
                          0
                        ) / movieData.ratings.length
                      ).toFixed(1)}
                    </span>
                    <span className="ml-1 text-sm">
                      ({movieData.ratings.length} {movieData.ratings.length === 1 ? "rating" : "ratings"})
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {"Lagt til: " +
                      new Date(movieData._createdAt).toLocaleDateString("no-NO", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </span>
                </div>
              </div>
              
              {/* Genres */}
              <div className="flex flex-wrap gap-2 mt-6">
                {movieData.genres &&
                  movieData.genres.map((genre: string) => (
                    <span
                      key={uuidv4()}
                      className="px-3 py-1 bg-gray-900/70 backdrop-blur-sm text-gray-300 text-sm rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
              </div>
              
              {/* Plot */}
              <p className="mt-6 text-gray-300 text-lg leading-relaxed max-w-3xl">
                {movieData.plot}
              </p>
              
              {/* Rate button */}
              <div className="mt-8">
                {session ? (
                  <button
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white rounded-lg py-3 px-6 font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-yellow-500/20"
                    onClick={() => setOpen(!open)}
                  >
                    <AiFillStar size={20} />
                    <span>Rate denne filmen</span>
                  </button>
                ) : (
                  <button
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white rounded-lg py-3 px-6 font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
                    onClick={() => signIn()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Logg inn for å rate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile poster (only visible on mobile) */}
      <div className="md:hidden -mt-20 px-4 mb-8">
        <div className="w-32 h-48 mx-auto shadow-2xl rounded-xl overflow-hidden border-4 border-gray-900">
          <Image
            width={128}
            height={192}
            src={urlFor(movieData.poster).url()}
            alt={movieData.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 bg-gray-900">
        <RatingModal
          open={open}
          setOpen={setOpen}
          rateMovie={rateMovie}
          movieId={movieData._id ?? ""}
        />

        {/* Individual ratings section */}
        {movieData.ratings && movieData.ratings.length > 0 && (
          <div className="mt-12 mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-900 pb-2">Individuelle vurderinger</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {movieData.ratings.map((rating: any) => (
                <div
                  key={uuidv4()}
                  className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 transition-transform duration-300 hover:transform hover:scale-105"
                >
                  {rating.person.image.asset && (
                    <Image
                      width={48}
                      height={48}
                      src={urlFor(rating.person.image.asset).url()}
                      alt={rating.person.name ?? "Ukjent"}
                      className="rounded-full w-12 h-12 object-cover border-2 border-gray-700"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">{rating.person.name}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xl font-bold text-yellow-500">{rating.rating}</span>
                      <AiFillStar className="text-yellow-500 ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments section */}
        <div className="mt-8">
          <CommentForm
            refetch={refetch}
            movieData={movieData}
            movieId={movieData._id}
            session={session}
          />
        </div>
      </div>
    </main>
  );
}

export default SingleMovie;
