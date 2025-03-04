import RatingModal from "@/components/modal/RatingModal";
import { client, clientWithToken, urlFor } from "@/config/client";
import { movieQuery } from "@/utils/groqQueries";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
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

  // Query to get the current user's person record
  const { data: personData, refetch: refetchPerson } = useQuery({
    queryKey: ["currentPerson"],
    enabled: !!session && !!session.user,
    queryFn: async () => {
      if (!session || !session.user || !session.user.name) return null;
      const personQuery = `*[_type == "person" && name == "${session.user.name}"]`;
      const result = await client.fetch(personQuery);
      return result[0] || null;
    },
  });

  const updateProfileImageIfChanged = useCallback(
    async (person: any, currentImageUrl: string) => {
      if (!person || !person.image || !person.image.asset) return;

      try {
        // Get the current image URL from Sanity
        const storedImageUrl = urlFor(person.image).url();

        // Extract just the base URL without query parameters for comparison
        const storedImageBase = storedImageUrl.split("?")[0];
        const currentImageBase = currentImageUrl.split("?")[0];

        // If the Discord image URL has changed, update the person's image in Sanity
        if (storedImageBase !== currentImageBase) {
          console.log("Updating profile image...");
          const imageAsset = await uploadExternalImage(currentImageUrl);

          await clientWithToken
            .patch(person._id)
            .set({
              image: {
                _type: "image",
                asset: {
                  _ref: imageAsset._id,
                },
              },
            })
            .commit();

          console.log("Profile image updated successfully");
          localStorage.setItem(
            `profile_update_${person._id}`,
            Date.now().toString()
          );
          refetchPerson();
        }
      } catch (error) {
        console.error("Error updating profile image:", error);
      }
    },
    [refetchPerson]
  );

  useEffect(() => {
    if (session && session.user && personData && session.user.image) {
      const lastUpdateTime = localStorage.getItem(
        `profile_update_${personData._id}`
      );
      const currentTime = Date.now();

      // Only update if it's been more than 24 hours since the last update
      if (
        !lastUpdateTime ||
        currentTime - parseInt(lastUpdateTime) > 24 * 60 * 60 * 1000
      ) {
        updateProfileImageIfChanged(personData, session.user.image);
      }
    }
  }, [session, personData, updateProfileImageIfChanged]);

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
      if (!session || !session.user || !session.user.name) {
        return;
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
    <main className="min-h-screen bg-black">
      <Head>
        <title>{movieData.title ?? ""}</title>
      </Head>

      {/* Hero section with backdrop */}
      <div className="relative w-full h-[65vh] md:h-[85vh] pt-12 md:pt-24">
        {/* Movie backdrop */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={urlFor(movieData.poster_backdrop.asset).url()}
            alt="Movie backdrop"
            fill
            priority
            className="object-cover opacity-90"
          />
          {/* Enhanced gradient overlays for better text readability while showing more of the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        </div>

        {/* Content container */}
        <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex md:block">
          {/* Mobile centered content */}
          <div className="md:hidden w-full flex flex-col items-center justify-end h-full text-center pb-10">
            <h1 className="text-3xl font-bold text-white mb-2 max-w-[280px]">
              {movieData.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-gray-200 mt-4 max-w-[280px]">
              {movieData.releaseDate && (
                <div className="flex items-center bg-black/80 px-3 py-1 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1 text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">
                    {new Date(movieData.releaseDate ?? "").getFullYear()}
                  </span>
                </div>
              )}

              {movieData.length && (
                <div className="flex items-center bg-black/80 px-3 py-1 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1 text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">{movieData.length} min</span>
                </div>
              )}

              {movieData.ratings && movieData.ratings.length > 0 && (
                <div className="flex items-center bg-black/80 px-3 py-1 rounded-full group relative">
                  <AiFillStar className="text-yellow-500 mr-1" />
                  <span className="text-sm">
                    {(
                      movieData.ratings.reduce(
                        (acc: number, curr: any) => acc + curr.rating,
                        0
                      ) / movieData.ratings.length
                    ).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Genres - Mobile */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-[280px]">
              {movieData.genres?.map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 bg-yellow-600/80 text-white text-xs font-medium rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Rate button - Mobile */}
            <div className="mt-6 flex justify-center">
              {session ? (
                <button
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg py-2 px-4 text-sm font-medium flex items-center gap-2"
                  onClick={() => setOpen(!open)}
                >
                  <AiFillStar size={18} />
                  <span>Rate denne filmen</span>
                </button>
              ) : (
                <button
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg py-2 px-4 text-sm font-medium flex items-center gap-2"
                  onClick={() => signIn()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Logg inn for å rate</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop left-aligned content */}
          <div className="hidden md:flex md:items-end md:h-full pb-16">
            <div className="flex flex-row items-start gap-8">
              {/* Movie poster - desktop only */}
              <div className="w-64 h-[450px] flex-shrink-0 -mb-32 shadow-2xl rounded-xl overflow-hidden border-4 border-black">
                <Image
                  width={256}
                  height={450}
                  src={urlFor(movieData.poster).url()}
                  alt={movieData.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Movie info */}
              <div className="flex-1 flex flex-col items-start text-left">
                <h1 className="text-5xl lg:text-6xl font-bold text-white mb-2">
                  {movieData.title}
                </h1>

                <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-gray-200 mt-4">
                  {/* Desktop metadata */}
                  {movieData.releaseDate && (
                    <div className="flex items-center bg-black/80 px-3 py-1 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1 text-yellow-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-base">
                        {new Date(movieData.releaseDate ?? "").getFullYear()}
                      </span>
                    </div>
                  )}

                  {movieData.length && (
                    <div className="flex items-center bg-black/80 px-3 py-1 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1 text-yellow-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-base">{movieData.length} min</span>
                    </div>
                  )}

                  {movieData.ratings && movieData.ratings.length > 0 && (
                    <div className="flex items-center bg-black/80 px-3 py-1 rounded-full group relative">
                      <AiFillStar className="text-yellow-500 mr-1" />
                      <span className="text-base">
                        {(
                          movieData.ratings.reduce(
                            (acc: number, curr: any) => acc + curr.rating,
                            0
                          ) / movieData.ratings.length
                        ).toFixed(1)}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        {movieData.ratings.length}{" "}
                        {movieData.ratings.length === 1 ? "rating" : "ratings"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Genres - Desktop */}
                <div className="flex flex-wrap gap-2 mt-4 justify-start">
                  {movieData.genres?.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-yellow-600/80 text-white text-sm font-medium rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Plot - Desktop */}
                <p className="mt-6 text-gray-300 text-lg leading-relaxed max-w-3xl">
                  {movieData.plot}
                </p>

                {/* Rate button - Desktop */}
                <div className="mt-8">
                  {session ? (
                    <button
                      className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-lg py-3 px-6 text-base font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-yellow-600/20"
                      onClick={() => setOpen(!open)}
                    >
                      <AiFillStar size={18} />
                      <span>Rate denne filmen</span>
                    </button>
                  ) : (
                    <button
                      className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-lg py-3 px-6 text-base font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-yellow-600/20"
                      onClick={() => signIn()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Logg inn for å rate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile poster and description section */}
      <div className="md:hidden bg-black">
        <div className="px-4 pt-0 pb-12">
          <div className="flex flex-col items-center mx-auto">
            <div className="w-[280px] h-[420px] shadow-xl rounded-lg overflow-hidden border border-gray-800 mx-auto">
              <Image
                width={280}
                height={420}
                src={urlFor(movieData.poster).url()}
                alt={movieData.title}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="mt-8 w-[280px] text-center mx-auto">
              {/* Plot - Mobile */}
              <p className="text-gray-300 text-base leading-relaxed mb-6">
                {movieData.plot}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 bg-black">
        <RatingModal
          open={open}
          setOpen={setOpen}
          rateMovie={rateMovie}
          movieId={movieData._id ?? ""}
        />

        {/* Individual ratings section */}
        {movieData.ratings && movieData.ratings.length > 0 && (
          <div className="mt-16 md:mt-32 mb-12 md:mb-16">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 border-b border-gray-800 pb-2">
              Individuelle vurderinger
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-items-start">
              {movieData.ratings.map((rating: any) => (
                <div
                  key={uuidv4()}
                  className="flex flex-col items-center transition-transform duration-300 hover:transform hover:scale-105"
                >
                  {rating.person.image.asset && (
                    <Image
                      width={64}
                      height={64}
                      src={urlFor(rating.person.image.asset).url()}
                      alt={rating.person.name ?? "Ukjent"}
                      className="rounded-full w-16 h-16 md:w-20 md:h-20 object-cover border-3 border-gray-800 shadow-md mb-2 md:mb-3"
                    />
                  )}
                  <div className="flex flex-col items-center">
                    <div className="bg-yellow-600 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center mb-1 md:mb-2">
                      <span className="text-white font-bold text-sm md:text-base">
                        {rating.rating}
                      </span>
                    </div>
                    <p className="text-white text-sm md:text-base font-medium text-center">
                      {rating.person.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments section */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 bg-black">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 border-b border-gray-800 pb-2">
            Kommentarer
          </h2>
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
