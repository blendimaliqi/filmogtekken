import RatingModal from "@/components/modal/RatingModal";
import { client, clientWithToken, urlFor } from "@/config/client";
import { movieQuery } from "@/utils/groqQueries";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import {
  useQuery,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AiFillStar } from "react-icons/ai";
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

  try {
    // We'll fetch comments and ratings client-side
    const movie = await client.fetch(
      `*[_type == "movie" && (slug.current == $movieId || _id == $movieId)][0]{
        _id,
        title,
        slug,
        poster,
        poster_backdrop,
        overview,
        plot,
        releaseDate,
        genres,
        cast,
        director,
        trailer
      }`,
      { movieId: slug }
    );

    // Log the movie data to help debug
    if (process.env.NODE_ENV !== "production") {
      console.log("Movie data from getServerSideProps:", {
        title: movie?.title,
        hasOverview: !!movie?.overview,
        overviewType: movie?.overview ? typeof movie.overview : "undefined",
        hasPlot: !!movie?.plot,
        plotLength: movie?.plot ? movie.plot.length : 0,
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
  const [open, setOpen] = useState(false);
  const [showLocalLoader, setShowLocalLoader] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // If initialMovieData is provided, ensure the plot field is set from overview if needed
  useEffect(() => {
    if (initialMovieData) {
      console.log(
        "Initial movie data:",
        JSON.stringify({
          title: initialMovieData.title,
          hasPlot: !!initialMovieData.plot,
          plotLength: initialMovieData.plot ? initialMovieData.plot.length : 0,
          hasOverview: !!initialMovieData.overview,
          overviewType: initialMovieData.overview
            ? typeof initialMovieData.overview
            : "undefined",
          overviewValue: initialMovieData.overview
            ? JSON.stringify(initialMovieData.overview).substring(0, 100)
            : "none",
        })
      );

      // Always ensure a plot field exists and is not empty
      if (!initialMovieData.plot || initialMovieData.plot === "") {
        if (initialMovieData.overview) {
          // Handle different types of overview field (string or BlockContent)
          if (typeof initialMovieData.overview === "string") {
            initialMovieData.plot = initialMovieData.overview;
          } else if (Array.isArray(initialMovieData.overview)) {
            // Handle array format (sometimes used for rich text)
            try {
              initialMovieData.plot = initialMovieData.overview
                .map((block: any) => {
                  if (typeof block === "string") return block;
                  if (block && block.children) {
                    return block.children
                      .map((child: any) => child?.text || "")
                      .join("");
                  }
                  return block?.text || "";
                })
                .join("\n")
                .trim();
            } catch (e) {
              console.error("Error processing overview array:", e);
              initialMovieData.plot = "No description available";
            }
          } else if (
            initialMovieData.overview._type &&
            initialMovieData.overview.children &&
            Array.isArray(initialMovieData.overview.children)
          ) {
            // Try to extract text from blockContent if possible
            try {
              const blocks = initialMovieData.overview.children || [];
              initialMovieData.plot = blocks
                .map((block: any) => block?.text || "")
                .join("\n")
                .trim();
            } catch (e) {
              console.error("Error extracting text from blockContent:", e);
              initialMovieData.plot = "No description available";
            }
          } else {
            // Fallback for other object structures - try to extract any text we can find
            try {
              // Try to find any text property in the overview object
              const overviewObj = initialMovieData.overview as any;
              if (overviewObj && typeof overviewObj === "object") {
                // Look for common text properties
                if (overviewObj.text) {
                  initialMovieData.plot = overviewObj.text;
                } else if (overviewObj.content) {
                  if (typeof overviewObj.content === "string") {
                    initialMovieData.plot = overviewObj.content;
                  } else if (Array.isArray(overviewObj.content)) {
                    initialMovieData.plot = overviewObj.content
                      .map((item: any) =>
                        typeof item === "string" ? item : item?.text || ""
                      )
                      .join("\n");
                  }
                } else {
                  // Last resort - stringify but clean it up
                  const stringified = JSON.stringify(overviewObj);
                  initialMovieData.plot = stringified
                    .replace(/[{}"\\]/g, "")
                    .replace(/,/g, ". ")
                    .replace(/:/g, ": ");
                }
              } else {
                initialMovieData.plot = "No description available";
              }
            } catch (e) {
              console.error("Error processing overview object:", e);
              initialMovieData.plot = "No description available";
            }
          }
        } else {
          initialMovieData.plot = "No description available";
        }
      }

      // Also handle the case where the plot exists but is empty
      if (initialMovieData.plot === "") {
        initialMovieData.plot = "No description available";
      }
    }
  }, [initialMovieData]);

  // Fetch the movie using our custom hook
  const {
    data: movie,
    isLoading,
    refetch,
  } = useMovie(slug as string, initialMovieData || undefined);

  // Create a safe movieData object that combines initial data and fetched data
  const movieData = useMemo(() => {
    try {
      // Use fetched data if available, otherwise fall back to initial data
      const data = movie || initialMovieData || ({} as Partial<Movie>);

      // Ensure essential properties exist to prevent runtime errors
      return {
        ...data,
        title: data.title || "Untitled Movie",
        plot: data.plot || "No description available",
        ratings: data.ratings || [],
        genres: data.genres || [],
        poster: data.poster || null,
        _id: data._id || "",
        overview: data.overview || null,
        length: data.length || 0,
        comments: data.comments || [],
      } as Movie;
    } catch (error) {
      console.error("Error creating movieData:", error);
      // Return a minimal safe object if there's an error
      return {
        _type: "movie",
        _id: "",
        _rev: "",
        _createdAt: "",
        _updatedAt: "",
        title: "Error loading movie",
        plot: "There was an error loading this movie's details.",
        ratings: [],
        genres: [],
        poster: null,
        poster_backdrop: null,
        overview: null,
        length: 0,
        comments: [],
        slug: { _type: "slug", current: "" },
        releaseDate: "",
        externalId: 0,
        popularity: 0,
      } as unknown as Movie;
    }
  }, [movie, initialMovieData]);

  // Pre-populate the cache with the initial data
  useEffect(() => {
    if (initialMovieData && slug) {
      queryClient.setQueryData(
        ["movies", "detail", slug as string],
        initialMovieData
      );
    }
  }, [initialMovieData, queryClient, slug]);

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

    // If we have initial data or cached data, don't show loader
    if (initialMovieData || movie) {
      // Just show content with a small delay for smooth animation
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    }

    // If we're loading and don't have initial data, show loader
    if (isLoading && !initialMovieData && !movie) {
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

  // Ensure plot is available for rendering
  useEffect(() => {
    if (movieData && (!movieData.plot || movieData.plot === "")) {
      if (movieData.overview) {
        console.log("Setting plot from overview in render component");
        // Use any available overview data
        if (typeof movieData.overview === "string") {
          movieData.plot = movieData.overview;
        } else {
          // Try to extract text from complex overview
          try {
            const overview = movieData.overview as any;
            if (Array.isArray(overview)) {
              movieData.plot = overview
                .map((block: any) => {
                  if (typeof block === "string") return block;
                  return block.text || "";
                })
                .join("\n");
            } else if (overview && typeof overview === "object") {
              if (overview.text) {
                movieData.plot = overview.text;
              } else {
                movieData.plot = JSON.stringify(overview)
                  .replace(/[{}"\\]/g, "")
                  .replace(/,/g, ". ");
              }
            }
          } catch (e) {
            console.error("Error processing overview in render:", e);
            movieData.plot = "No description available";
          }
        }
      } else {
        movieData.plot = "No description available";
      }
    }
  }, [movieData]);

  // Debug logging for movieData
  useEffect(() => {
    if (movieData) {
      console.log(
        "Rendered movie data:",
        JSON.stringify({
          title: movieData.title,
          hasPlot: !!movieData.plot,
          plotLength: movieData.plot ? movieData.plot.length : 0,
          plotPreview: movieData.plot
            ? movieData.plot.substring(0, 50) + "..."
            : "none",
          hasOverview: !!movieData.overview,
          plotValue: movieData.plot,
        })
      );
    }
  }, [movieData]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!movie) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500"></div>
        </div>
      </div>
    );
  }

  if (isLoading || session === null)
    return (
      <div style={centerStyle}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500"></div>
        </div>
      </div>
    );

  if (session === null) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500"></div>
        </div>
      </div>
    );
  }

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

  // Wrap the entire render in a try-catch to prevent client-side exceptions
  try {
    return (
      <main className="min-h-screen bg-black">
        <Head>
          <title>{movieData.title ?? ""}</title>
        </Head>

        {/* Loading state */}
        {showLocalLoader && (
          <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 animate-fadeIn">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500"></div>
            </div>
          </div>
        )}

        {/* Hero section with backdrop */}
        <div className="relative w-full h-[65vh] md:h-[85vh] pt-12 md:pt-24">
          {/* Movie backdrop */}
          <div className="absolute inset-0 w-full h-full">
            {movieData.poster_backdrop && movieData.poster_backdrop.asset ? (
              <Image
                src={urlFor(movieData.poster_backdrop.asset).url()}
                alt="Movie backdrop"
                fill
                priority
                className={`object-cover ${
                  contentVisible ? "animate-backdropFadeFast" : "opacity-0"
                }`}
              />
            ) : movieData.poster && movieData.poster.asset ? (
              <Image
                src={urlFor(movieData.poster.asset).url()}
                alt="Movie poster"
                fill
                priority
                className={`object-cover object-center ${
                  contentVisible ? "animate-backdropFadeFast" : "opacity-0"
                }`}
              />
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <p className="text-gray-500 text-lg">No backdrop available</p>
              </div>
            )}
            {/* Lighter gradient overlays for a less dark appearance */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
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
                        <span className="text-base">
                          {movieData.length} min
                        </span>
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
                          {movieData.ratings.length === 1
                            ? "rating"
                            : "ratings"}
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
                    {movieData.plot ||
                      (movieData.overview &&
                      typeof movieData.overview === "string"
                        ? movieData.overview
                        : "No description available")}
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
                {movieData && movieData.poster && movieData.poster.asset ? (
                  <Image
                    width={280}
                    height={420}
                    src={urlFor(movieData.poster).url()}
                    alt={movieData.title || "Movie poster"}
                    className="w-full h-full object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500">No poster available</span>
                  </div>
                )}
              </div>
              <div className="mt-8 w-[280px] text-center mx-auto">
                {/* Plot - Mobile */}
                <p className="text-gray-300 text-base leading-relaxed mb-6">
                  {movieData && movieData.plot
                    ? movieData.plot
                    : "No description available"}
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
              <h2 className="text-3xl font-bold text-white mb-8">
                Kommentarer
              </h2>
              <CommentForm
                movieId={movieData._id}
                session={session}
                movieData={movieData}
                refetch={refetch}
                hideHeading={true}
              />
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    // If there's an error during rendering, show a fallback UI
    console.error("Error rendering movie page:", error);
    return (
      <main className="bg-black min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl text-white font-bold mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-400 mb-6">
          We encountered an error while loading this movie.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg py-2 px-6 font-medium transition-all duration-300"
        >
          Return to Home
        </button>
      </main>
    );
  }
}

export default SingleMovie;
