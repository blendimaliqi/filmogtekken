import React, { useState, useEffect, useMemo } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import HomepageImage from "@/components/HomepageImage";
import MovieTitle from "@/components/MovieTitle";
import { client, urlFor } from "../config/client";
import { ColorRing } from "react-loader-spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { atom, useAtom } from "jotai";
import Movies from "@/components/Movies";
import { moviesQuery } from "@/utils/groqQueries";
import { Movie } from "@/typings";
import { uuidv4 } from "@/utils/helperFunctions";
import { useMovies } from "@/hooks";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

export const centerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
};

export const moviesAtom = atom<Movie[]>([]);
export const moviesSortedAtom = atom<Movie[]>([]);
export const moviesFilteredAtom = atom("default");

// Detect if we're on a mobile device
const isMobile = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
};

export default function Home() {
  const [movies, setMovies] = useAtom(moviesAtom);
  const [contentVisible, setContentVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const queryClient = useQueryClient();

  const { isLoading, error, data, refetch } = useMovies();
  const router = useRouter();

  // Check for mobile view on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(isMobile());
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    if (data) {
      setMovies(data);

      const moviesToCache = isMobileView ? data.slice(0, 10) : data;

      moviesToCache.forEach((movie) => {
        const movieId = movie._id;
        const slug = movie.slug?.current;

        if (movieId) {
          queryClient.setQueryData(["movies", "detail", movieId], movie);
        }

        if (slug) {
          queryClient.setQueryData(["movies", "detail", slug], movie);
        }
      });
    }
  }, [data, setMovies, queryClient, isMobileView]);

  // Add fade-in effect when component mounts or data loads
  useEffect(() => {
    if (!isLoading && data) {
      // Small delay for smooth animation
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data]);

  // Hide content when navigating away
  useEffect(() => {
    const handleRouteChange = () => {
      setContentVisible(false);
    };

    router.events.on("routeChangeStart", handleRouteChange);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router.events]);

  // Memoize the sorted movies to avoid unnecessary re-renders
  const sortedMovies = useMemo(() => {
    if (!data) return [];
    const sorted = [...data].sort((a: Movie, b: Movie) => {
      return (
        new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
      );
    });
    return sorted;
  }, [data]);

  // Memoize the movies to display in the carousel
  const moviesToDisplay = useMemo(() => {
    const sliced = sortedMovies.slice(0, isMobileView ? 3 : 5);
    return sliced;
  }, [sortedMovies, isMobileView]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading movies:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
        <h2 className="text-2xl font-bold mb-4">Error Loading Movies</h2>
        <p className="mb-4">
          Sorry, we couldn&apos;t load the movies. Please try again later.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
        <h2 className="text-2xl font-bold mb-4">No Movies Found</h2>
        <p>There are currently no movies in the database.</p>
      </div>
    );
  }

  return (
    <main className="bg-black">
      <div
        className={`transition-opacity duration-300 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="relative">
          {/* Desktop Carousel */}
          <Carousel
            className="hidden md:block"
            autoPlay={true}
            interval={10000}
            stopOnHover={false}
            infiniteLoop={true}
            showThumbs={false}
            showStatus={false}
            showArrows={true}
            swipeable={true}
            emulateTouch={true}
            dynamicHeight={false}
            renderIndicator={(onClickHandler, isSelected, index, label) => {
              const indicatorClasses = isSelected
                ? "w-12 bg-yellow-600"
                : "w-8 bg-gray-700 hover:bg-gray-600";

              return (
                <button
                  type="button"
                  onClick={onClickHandler}
                  className={`h-1.5 rounded-full mx-1 transition-all duration-300 ${indicatorClasses}`}
                  aria-label={`Slide ${index + 1}`}
                  title={`${label} ${index + 1}`}
                />
              );
            }}
            renderArrowPrev={(onClickHandler, hasPrev) =>
              hasPrev && (
                <button
                  type="button"
                  onClick={onClickHandler}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300"
                  aria-label="Previous slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )
            }
            renderArrowNext={(onClickHandler, hasNext) =>
              hasNext && (
                <button
                  type="button"
                  onClick={onClickHandler}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300"
                  aria-label="Next slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )
            }
          >
            {moviesToDisplay.map((movie: Movie) => (
              <HomepageImage
                key={uuidv4()}
                url={urlFor(movie.poster_backdrop.asset).url() ?? ""}
              >
                <MovieTitle movie={movie} />
              </HomepageImage>
            ))}
          </Carousel>

          {/* Gradient overlay to create seamless transition to movies section */}
          <div className="hidden md:block absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent"></div>
        </div>

        {/* Pass the sortedMovies to the Movies component */}
        <div
          className={`transition-opacity duration-300 ${
            contentVisible ? "opacity-100 animate-pureFade" : "opacity-0"
          }`}
        >
          <Movies movies={sortedMovies} />
        </div>
      </div>
    </main>
  );
}
