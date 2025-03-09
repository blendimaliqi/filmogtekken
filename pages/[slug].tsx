import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { client, clientWithToken, urlFor } from "@/config/client";
import { movieQuery } from "@/utils/groqQueries";
import { centerStyle } from ".";
import { Movie } from "@/typings";
import Head from "next/head";
import { useSession, signIn } from "next-auth/react";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import CommentForm from "@/components/CommentForm";
import { AiFillStar } from "react-icons/ai";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import { ColorRing } from "react-loader-spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import RatingModal from "@/components/modal/RatingModal";
import { movieKeys } from "@/hooks/useMovie";

// Server-side props to get initial movie data
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { slug } = context.params || {};
    if (!slug) {
      return {
        props: {
          initialMovieData: null,
        },
      };
    }

    const initialMovieData = await client.fetch(movieQuery, {
      movieId: slug,
    });

    return {
      props: {
        initialMovieData: initialMovieData || null,
      },
    };
  } catch (error) {
    console.error("Error fetching movie:", error);
    return {
      props: {
        initialMovieData: null,
      },
    };
  }
};

function SingleMovie({ initialMovieData }: { initialMovieData: Movie | null }) {
  const router = useRouter();
  const { slug } = router.query;
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const queryClient = useQueryClient();

  const slugString =
    typeof slug === "string" ? slug : Array.isArray(slug) ? slug[0] : "";

  // Use TanStack Query to fetch movie data
  const {
    data: movieData,
    isLoading: isQueryLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: movieKeys.detail(slugString),
    queryFn: async () => {
      if (!slugString) return null;
      // Use the same query as in getServerSideProps
      const result = await client.fetch(movieQuery, { movieId: slugString });

      // Add proper null check
      if (!result) throw new Error(`Movie not found: ${slugString}`);

      return result;
    },
    initialData: initialMovieData,
    enabled: !!slugString,
    staleTime: 1000 * 30, // 30 seconds stale time to balance performance and freshness
  });

  // Handle page visibility to ensure fresh data
  useEffect(() => {
    if (!router.isReady) return;

    // Fade in content when movie data is loaded
    setContentVisible(false);
    const timer = setTimeout(() => setContentVisible(true), 100);

    return () => clearTimeout(timer);
  }, [slugString, router.isReady]);

  // Monitor route changes
  useEffect(() => {
    const handleStart = (url: string) => {
      setIsRouteLoading(true);
      setContentVisible(false);
    };

    const handleComplete = () => {
      setIsRouteLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // Rate movie function
  const rateMovie = useCallback(
    async (movieId: string, rating: number) => {
      try {
        if (!session?.user?.name) return;

        const userName = session.user.name;
        const personQuery = `*[_type == "person" && name == "${userName}"]`;
        const [existingPerson] = await client.fetch(personQuery);

        let person: any;

        if (!existingPerson) {
          // Create a new person if not found
          const imageAsset = await uploadExternalImage(
            session.user.image ?? ""
          );
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
            updatedRatings[existingRatingIndex]._createdAt =
              new Date().toISOString();
            movieWithRating.ratings = updatedRatings;
          } else {
            const newRating = {
              _key: uuidv4(),
              person: { _type: "reference", _ref: person._id },
              rating: rating,
              _createdAt: new Date().toISOString(),
            };
            movieWithRating.ratings.push(newRating);
          }

          await clientWithToken
            .patch(movieId)
            .set({ ratings: movieWithRating.ratings })
            .commit({});
        } else {
          const newRating = {
            _key: uuidv4(),
            person: { _type: "reference", _ref: person._id },
            rating: rating,
            _createdAt: new Date().toISOString(),
          };

          await clientWithToken
            .patch(movieId)
            .setIfMissing({ ratings: [] })
            .append("ratings", [newRating])
            .commit({});
        }

        // Properly invalidate queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: movieKeys.detail(slugString),
        });
        queryClient.invalidateQueries({ queryKey: movieKeys.lists() });
        queryClient.invalidateQueries({ queryKey: movieKeys.list(undefined) });
      } catch (error) {
        console.error("Error updating movie rating:", error);
      }
    },
    [session, slugString, queryClient]
  );

  // Calculate average rating directly (no need for useMemo)
  function calculateAverageRating(ratings: any[] | null = []) {
    // More robust null/undefined check to prevent "Cannot read properties of null" error
    if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
      return null;
    }

    try {
      const sum = ratings.reduce((acc, curr) => {
        const rating = curr?.rating ? Number(curr.rating) : 0;
        return acc + rating;
      }, 0);
      return (sum / ratings.length).toFixed(1);
    } catch (error) {
      console.error("Error calculating rating:", error);
      return null;
    }
  }

  // Loading state
  const isLoading =
    !router.isReady || isRouteLoading || (isQueryLoading && !movieData);

  if (isLoading) {
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
  }

  if (error) {
    console.error("Error loading movie:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Error loading movie</h1>
        <p className="text-gray-400 mb-6">
          {error instanceof Error
            ? error.message
            : "We encountered a problem while loading this movie."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-lg"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (!movieData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
        <p className="text-gray-400 mb-6">
          We couldn&apos;t find the movie you&apos;re looking for.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-lg"
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Calculate average rating for the UI
  const averageRating = calculateAverageRating(movieData.ratings);

  return (
    <main className="bg-black min-h-screen">
      <Head>
        <title>{movieData.title ?? ""}</title>
        <meta name="description" content={movieData.plot || ""} />
      </Head>

      {/* Hero section with backdrop */}
      <div className="relative">
        {/* Backdrop image */}
        <div className="absolute inset-0 h-[100vh]">
          <Image
            src={
              movieData.poster_backdrop
                ? typeof movieData.poster_backdrop === "string"
                  ? movieData.poster_backdrop
                  : movieData.poster_backdrop?.url
                  ? movieData.poster_backdrop.url
                  : urlFor(movieData.poster_backdrop).url()
                : movieData.poster
                ? typeof movieData.poster === "string"
                  ? movieData.poster
                  : movieData.poster?.url
                  ? movieData.poster.url
                  : urlFor(movieData.poster).url()
                : "/notfound.png" // Fallback image
            }
            alt={movieData.title || "Movie backdrop"}
            priority
            fill
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black" />
        </div>

        {/* Movie content */}
        <div
          className={`relative pt-80 pb-40 px-4 md:px-8 lg:px-16 transition-opacity duration-700 ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Movie poster with added date */}
              <div className="flex-shrink-0 flex flex-col gap-4">
                {movieData._createdAt && (
                  <div className="text-gray-400 text-sm">
                    Lagt til{" "}
                    {new Date(movieData._createdAt).toLocaleDateString(
                      "no-NO",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                )}
                {movieData.poster ? (
                  <Image
                    width={300}
                    height={450}
                    src={
                      typeof movieData.poster === "string"
                        ? movieData.poster
                        : movieData.poster?.url
                        ? movieData.poster.url
                        : urlFor(movieData.poster).url()
                    }
                    alt={movieData.title || "Movie poster"}
                    className="rounded-xl shadow-2xl"
                    priority
                  />
                ) : (
                  <div className="w-[300px] h-[450px] bg-gray-800 rounded-xl flex items-center justify-center">
                    <span className="text-gray-500">No poster available</span>
                  </div>
                )}
              </div>

              {/* Movie info */}
              <div className="flex-1 text-white">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
                  {movieData.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-6 text-lg text-gray-300">
                  {/* Release year */}
                  {movieData.releaseDate && (
                    <div className="flex items-center">
                      <span>
                        {new Date(movieData.releaseDate).getFullYear()}
                      </span>
                    </div>
                  )}

                  {/* Runtime */}
                  {movieData.length && (
                    <div className="flex items-center">
                      <span>{movieData.length} min</span>
                    </div>
                  )}

                  {/* Average rating - enhanced visibility */}
                  {averageRating && (
                    <div className="flex items-center gap-1 bg-yellow-600/80 px-3 py-1 rounded-full">
                      <span className="text-white font-medium">
                        {averageRating}
                      </span>
                      <AiFillStar className="text-white text-sm" />
                      <span className="text-white/90 text-sm ml-1">
                        ({movieData.ratings.length}{" "}
                        {movieData.ratings.length === 1 ? "rating" : "ratings"})
                      </span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {movieData.genres?.map((genre: string) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-yellow-600/80 text-white text-sm font-medium rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Plot */}
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {movieData.plot || "No description available"}
                </p>

                {/* Rate button */}
                {session ? (
                  <button
                    className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg py-3 px-6 font-medium flex items-center gap-2"
                    onClick={() => setOpen(!open)}
                  >
                    <AiFillStar size={18} />
                    <span>Rate denne filmen</span>
                  </button>
                ) : (
                  <button
                    className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg py-3 px-6 font-medium flex items-center gap-2"
                    onClick={() => signIn()}
                  >
                    <AiFillStar size={18} />
                    <span>Logg inn for å rate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div
        className={`relative max-w-7xl mx-auto px-4 md:px-8 pb-20 transition-opacity duration-700 delay-200 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <RatingModal
          open={open}
          setOpen={setOpen}
          rateMovie={rateMovie}
          movieId={movieData._id}
        />

        {/* Individual ratings section */}
        {movieData.ratings &&
        Array.isArray(movieData.ratings) &&
        movieData.ratings.length > 0 ? (
          <div className="mt-0 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Individuell Rating
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movieData.ratings.map((rating: any, index: number) => {
                // Get the person safely
                const person =
                  typeof rating.person === "object" ? rating.person : null;
                const hasImage = person && person.image;
                const imageUrl = hasImage
                  ? typeof person.image === "string"
                    ? person.image
                    : person.image?.url
                    ? person.image.url
                    : urlFor(person.image).url()
                  : null;

                return (
                  <div
                    key={rating._key || `rating-${index}`}
                    className="flex items-center gap-4 bg-zinc-900/50 rounded-xl p-4 backdrop-blur-sm border border-zinc-800/50 hover:border-yellow-600/30 transition-all duration-300"
                  >
                    {imageUrl ? (
                      <Image
                        width={50}
                        height={50}
                        src={imageUrl}
                        alt={person?.name || "Ukjent"}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-[50px] h-[50px] rounded-full bg-zinc-800 flex items-center justify-center">
                        <span className="text-zinc-500 text-lg">
                          {person && person.name
                            ? person.name.charAt(0).toUpperCase()
                            : "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium mb-1">
                        {person ? person.name : "Ukjent bruker"}
                      </div>
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">
                          {rating.rating}
                        </span>
                        <AiFillStar className="text-yellow-500 text-sm" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-0 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Individuell Rating
            </h2>
            <p className="text-gray-400">
              Ingen rangeringer ennå. Bli den første til å rangere denne filmen!
            </p>
          </div>
        )}

        {/* Comments section */}
        <div id="comments" className="mt-20">
          <CommentForm
            movieId={movieData._id}
            session={session}
            movieData={movieData}
            refetch={refetch}
          />
        </div>
      </div>
    </main>
  );
}

export default SingleMovie;
