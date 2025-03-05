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
import { useMovie, useCurrentPerson, useRateMovie } from "@/hooks";
import { toast } from "react-toastify";

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
  const [contentVisible, setContentVisible] = useState(false);
  const [showLocalLoader, setShowLocalLoader] = useState(false);

  const {
    isLoading,
    error,
    data: movie,
    refetch,
  } = useMovie(router.query.slug as string, initialMovieData || undefined);

  // Handle loading state
  useEffect(() => {
    // Remove any existing loading overlay from the Movie component
    const existingOverlay = document.getElementById("movie-loading-overlay");
    if (existingOverlay) {
      existingOverlay.style.opacity = "0";
      setTimeout(() => {
        existingOverlay.remove();
      }, 300);
    }

    // If we have initial data, don't show loader
    if (initialMovieData) {
      // Just show content with a small delay for smooth animation
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    }

    // If we're loading and don't have initial data, show loader
    if (isLoading && !initialMovieData) {
      setShowLocalLoader(true);
      setContentVisible(false);
    } else {
      // Data loaded, hide loader and show content
      const loaderTimer = setTimeout(() => {
        setShowLocalLoader(false);
      }, 200);

      // Show content with a small delay after loader disappears
      const contentTimer = setTimeout(() => {
        setContentVisible(true);
      }, 250);

      return () => {
        clearTimeout(loaderTimer);
        clearTimeout(contentTimer);
      };
    }
  }, [isLoading, initialMovieData, movie]);

  // Hide content when navigating away
  useEffect(() => {
    const handleRouteChange = () => {
      setContentVisible(false);
    };

    router.events.on("routeChangeStart", handleRouteChange);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router]);

  // Get the current user's person record
  const { data: personData, refetch: refetchPerson } = useCurrentPerson();

  // Use the rating mutation
  const rateMovieMutation = useRateMovie();

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

  if (!movie) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
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
  }

  const movieData = movie || {};

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
      if (!session || !session.user || !session.user.name || !personData) {
        return;
      }

      rateMovieMutation.mutate(
        {
          movieId,
          personId: personData._id,
          rating,
        },
        {
          onSuccess: () => {
            refetch();
          },
          onError: (error) => {
            console.error("Error rating movie:", error);
          },
        }
      );
    } catch (error) {
      console.error("Error rating movie:", error);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <Head>
        <title>{movieData.title ?? ""}</title>
      </Head>

      {/* Loading spinner - only shown when actually loading and no initial data */}
      {showLocalLoader && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black transition-opacity duration-500 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-[5px] border-gray-700 border-t-white"></div>
        </div>
      )}

      {/* Hero section with backdrop */}
      <div className="relative w-full h-[65vh] md:h-[85vh] pt-12 md:pt-24">
        {/* Movie backdrop */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={urlFor(movieData.poster_backdrop.asset).url()}
            alt="Movie backdrop"
            fill
            priority
            className={`object-cover ${
              contentVisible ? "animate-backdropFadeFast" : "opacity-0"
            }`}
          />
          {/* Enhanced gradient overlays for better text readability while showing more of the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        </div>

        {/* Content container */}
        <div
          className={`relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex md:block transition-all duration-700 ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
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
                    {new Date(movieData.releaseDate).getFullYear()}
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
                        (acc: number, curr: any) => acc + (curr.rating || 0),
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
              <div className="w-64 h-[450px] flex-shrink-0 -mb-32 shadow-2xl rounded-xl overflow-hidden border-4 border-black transition-transform duration-700 ease-out transform">
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
                        {new Date(movieData.releaseDate).getFullYear()}
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
                            (acc: number, curr: any) =>
                              acc + (curr.rating || 0),
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
      <div
        className={`md:hidden bg-black transition-all duration-700 delay-100 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
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
      <div
        className={`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 bg-black transition-all duration-700 delay-200 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
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
              Vurderinger
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-items-start">
              {movieData.ratings &&
                movieData.ratings.map((rating: any, index: number) => (
                  <div
                    key={uuidv4()}
                    className={`flex flex-col items-center transition-all duration-500 hover:transform hover:scale-105 ${
                      contentVisible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ transitionDelay: `${200 + index * 50}ms` }}
                  >
                    {rating.person &&
                    rating.person.image &&
                    rating.person.image.asset ? (
                      <Image
                        width={64}
                        height={64}
                        src={urlFor(rating.person.image.asset).url()}
                        alt={rating.person.name ?? "Ukjent"}
                        className="rounded-full w-16 h-16 md:w-20 md:h-20 object-cover border-3 border-gray-800 shadow-md mb-2 md:mb-3"
                      />
                    ) : (
                      <div className="rounded-full w-16 h-16 md:w-20 md:h-20 bg-gray-700 flex items-center justify-center mb-2 md:mb-3">
                        <span className="text-gray-400 text-xl">?</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <div className="bg-yellow-600 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center mb-1 md:mb-2">
                        <span className="text-white font-bold text-sm md:text-base">
                          {rating.rating}
                        </span>
                      </div>
                      <span className="text-white text-xs md:text-sm font-medium text-center">
                        {rating.person && rating.person.name
                          ? rating.person.name
                          : "Ukjent"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Comments section */}
        <section
          className={`py-16 bg-black transition-all duration-700 delay-300 ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-8">Kommentarer</h2>
            <CommentForm
              movieId={movieData._id}
              session={session}
              movieData={movieData}
              refetch={refetch}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

export default SingleMovie;
