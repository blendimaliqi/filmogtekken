import RatingModal from "@/components/modal/RatingModal";
import { client, urlFor, clientWithToken } from "@/config/client";
import { movieQuery } from "@/utils/groqQueries";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
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
  try {
    const { slug } = context.params!;

    // We'll fetch comments and ratings client-side
    const movie = await client.fetch(movieQuery, { movieId: slug });

    // Log the movie data to help debug
    if (process.env.NODE_ENV !== "production") {
      console.log("Movie data from getServerSideProps:", {
        id: movie?._id,
        title: movie?.title,
        hasOverview: !!movie?.overview,
        hasPlot: !!movie?.plot,
        slug: movie?.slug?.current,
      });
    }

    return {
      props: {
        initialMovieData: movie || null,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
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

  // Prefetch data for smoother transitions
  useEffect(() => {
    if (slug && typeof slug === "string") {
      queryClient.prefetchQuery({
        queryKey: ["movie", slug],
        queryFn: async () => {
          const result = await client.fetch(movieQuery, { movieId: slug });
          return result;
        },
      });
    }
  }, [slug, queryClient]);

  // Reset content visibility on route change
  useEffect(() => {
    if (!router.isReady) return;

    setContentVisible(false);
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, [slug, router.isReady]);

  // Monitor route changes to handle loading state
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

  // Store the movie ID for consistent reference
  const movieId = initialMovieData?._id || "";

  // Fetch the movie using tanstack query with improved configuration
  const {
    data: movie,
    isLoading: isQueryLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["movie", slug],
    enabled: router.isReady && !!slug && typeof slug === "string",
    initialData: initialMovieData,
    queryFn: async () => {
      if (!slug || typeof slug !== "string") return null;
      console.log("Fetching movie data for slug:", slug);
      const result = await client.fetch(movieQuery, { movieId: slug });
      if (!result) {
        throw new Error(`Movie not found for slug: ${slug}`);
      }
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Only retry once to avoid infinite loading on real errors
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    cacheTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  // Debug log the movie data and query state
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("Query state:", {
        slug,
        isRouteLoading,
        isQueryLoading,
        hasMovie: !!movie,
        movieId: movie?._id,
        routerReady: router.isReady,
      });
    }
  }, [slug, isRouteLoading, isQueryLoading, movie, router.isReady]);

  // Determine if we're in a loading state with more precise conditions
  const isLoading =
    !router.isReady ||
    isRouteLoading ||
    (isQueryLoading && !movie) ||
    (!movie && !!slug);

  // Handle loading state
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

  // Handle error state
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

  const movieData = movie;

  // Safeguard against undefined data
  if (!movieData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
        <p className="text-gray-400 mb-6">
          We couldn't find the movie you're looking for.
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

  // Function to rate a movie
  async function rateMovie(movieId: string, rating: number) {
    try {
      if (!session?.user?.name) return;

      console.log(`Rating movie with ID: ${movieId}, rating value: ${rating}`);

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

      // Log the person for debugging
      if (process.env.NODE_ENV !== "production") {
        console.log("Rating from person:", {
          id: person._id,
          name: person.name,
        });
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

        await client
          .patch(movieId)
          .set({ ratings: movieWithRating.ratings })
          .commit();
      } else {
        const newRating = {
          _key: uuidv4(),
          person: { _type: "reference", _ref: person._id },
          rating: rating,
          _createdAt: new Date().toISOString(),
        };

        await client
          .patch(movieId)
          .setIfMissing({ ratings: [] })
          .append("ratings", [newRating])
          .commit();
      }

      // Refresh data
      refetch();
    } catch (error) {
      console.error("Error updating movie rating:", error);
    }
  }

  // Calculate average rating
  const averageRating =
    movieData.ratings && movieData.ratings.length > 0
      ? (
          movieData.ratings.reduce(
            (acc: number, curr: any) => acc + curr.rating,
            0
          ) / movieData.ratings.length
        ).toFixed(1)
      : null;

  return (
    <main className="bg-black min-h-screen">
      <Head>
        <title>{movieData.title ?? ""}</title>
        <meta name="description" content={movieData.plot || ""} />
      </Head>

      {/* Hero section with backdrop */}
      <div className="relative">
        {/* Backdrop image */}
        {movieData.poster_backdrop && movieData.poster_backdrop.asset && (
          <>
            <div className="absolute inset-0 h-[80vh]">
              <Image
                src={urlFor(movieData.poster_backdrop).url()}
                alt={movieData.title || "Movie backdrop"}
                priority
                fill
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black" />
            </div>
          </>
        )}

        {/* Movie content */}
        <div
          className={`relative pt-60 pb-20 px-4 md:px-8 lg:px-16 transition-opacity duration-700 ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Movie poster */}
              <div className="flex-shrink-0">
                {movieData.poster && movieData.poster.asset ? (
                  <Image
                    width={300}
                    height={450}
                    src={urlFor(movieData.poster).url()}
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
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
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

                  {/* Added date */}
                  {movieData._createdAt && (
                    <div className="flex items-center">
                      <span className="text-gray-400">
                        Lagt til{" "}
                        {new Date(movieData._createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Average rating */}
                  {averageRating && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">{averageRating}</span>
                      <AiFillStar className="text-yellow-500" />
                      <span className="text-sm">
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
        className={`max-w-7xl mx-auto px-4 md:px-8 pb-20 transition-opacity duration-700 delay-200 ${
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
        {movieData.ratings && movieData.ratings.length > 0 && (
          <div className="mt-24 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-yellow-600/50 pb-2">
              Individuell Rating
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-12 gap-y-8 justify-items-start">
              {movieData.ratings.map((rating: any, index: number) => {
                // Get the person safely
                const person =
                  typeof rating.person === "object" ? rating.person : null;
                const hasImage = person && person.image && person.image.asset;

                return (
                  <div
                    key={rating._key || `rating-${index}`}
                    className="flex flex-col items-center w-fit"
                  >
                    {hasImage ? (
                      <Image
                        width={80}
                        height={80}
                        src={urlFor(person.image).url()}
                        alt={person.name || "Ukjent"}
                        className="rounded-full object-cover mb-3"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mb-3">
                        <span className="text-gray-400 text-xl">?</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <div className="bg-yellow-600 rounded-full w-12 h-12 flex items-center justify-center mb-2 border-2 border-yellow-800">
                        <span className="text-white font-bold text-xl">
                          {rating.rating}
                        </span>
                      </div>
                      <span className="text-white text-base font-medium">
                        {person?.name || "Ukjent"}
                      </span>
                      {rating._createdAt && (
                        <span className="text-gray-400 text-xs mt-1">
                          {new Date(rating._createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments section */}
        <div className="py-16">
          <h2 className="text-2xl font-bold text-white mb-8">Kommentarer</h2>
          <CommentForm
            movieId={movieData._id}
            session={session}
            movieData={movieData}
            refetch={refetch}
            hideHeading={true}
          />
        </div>
      </div>
    </main>
  );
}

export default SingleMovie;
