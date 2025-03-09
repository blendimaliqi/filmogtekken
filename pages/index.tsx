import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import HomepageImage from "@/components/HomepageImage";
import MovieTitle from "@/components/MovieTitle";
import { urlFor } from "../config/client";
import { ColorRing } from "react-loader-spinner";
import { useQueryClient } from "@tanstack/react-query";
import Movies from "@/components/Movies";
import { Movie } from "@/typings";
import { uuidv4 } from "@/utils/helperFunctions";
import { useMovies } from "@/hooks";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { movieKeys } from "@/hooks/useMovie";

export const centerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
};

// Detect if we're on a mobile device
const isMobile = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
};

// Component to render just the add movie functionality
const StandaloneAddMovieButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const refreshMovies = useCallback(() => {
    // Just invalidate the query cache, no need to force reload
    queryClient.invalidateQueries({ queryKey: ["movies"] });
  }, [queryClient]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold py-4 px-6 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 cursor-pointer"
      >
        Add Your First Movie
      </button>

      {isOpen && (
        <Movies isAddMovieModalOpen={true} onMovieAdded={refreshMovies} />
      )}
    </>
  );
};

// Create a separate carousel component to isolate any hook issues
const MovieCarousel = ({ movies = [] }: { movies: Movie[] }) => {
  // Safety check
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <Carousel
      className="hidden md:block carousel-container"
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
      {movies.map((movie: Movie) => {
        // Handle different possible types of poster_backdrop
        let imageUrl = "/notfound.png";

        try {
          if (movie?.poster_backdrop) {
            // Direct string URL
            if (typeof movie.poster_backdrop === "string") {
              imageUrl = movie.poster_backdrop;
            }
            // Object with URL property
            else if (
              typeof movie.poster_backdrop === "object" &&
              "url" in movie.poster_backdrop &&
              typeof movie.poster_backdrop.url === "string"
            ) {
              imageUrl = movie.poster_backdrop.url;
            }
            // Sanity image reference
            else if (
              typeof movie.poster_backdrop === "object" &&
              movie.poster_backdrop.asset
            ) {
              imageUrl = urlFor(movie.poster_backdrop).url();
            }
          }
        } catch (error) {
          console.error("Error getting image URL:", error);
        }

        return (
          <HomepageImage key={movie._id || uuidv4()} url={imageUrl}>
            <MovieTitle movie={movie} />
          </HomepageImage>
        );
      })}
    </Carousel>
  );
};

export default function Home() {
  const [contentVisible, setContentVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isLoading, error, data: movies } = useMovies();

  // Function to refresh the movie cache
  const refreshMovieCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["movies"] });
  }, [queryClient]);

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

  // Pre-populate movie cache to improve performance
  useEffect(() => {
    if (movies && Array.isArray(movies)) {
      try {
        // On mobile, limit the number of movies we cache to reduce memory usage
        const moviesToCache = isMobileView ? movies.slice(0, 10) : movies;

        moviesToCache.forEach((movie) => {
          if (!movie) return;

          const movieId = movie._id;
          const slug = movie.slug?.current;

          if (movieId) {
            // Cache by ID using consistent query keys
            queryClient.setQueryData(movieKeys.detail(movieId), movie);
          }

          if (slug) {
            // Cache by slug using consistent query keys
            queryClient.setQueryData(movieKeys.detail(slug), movie);
          }
        });
      } catch (error) {
        console.error("Error populating movie cache:", error);
      }
    }
  }, [movies, queryClient, isMobileView]);

  // Always create moviesToDisplay with useMemo regardless of conditions
  const moviesToDisplay = useMemo(() => {
    if (!movies || !Array.isArray(movies)) return [];

    // Sort movies by creation date
    const sortedMovies = [...movies].sort((a, b) => {
      try {
        const dateA = new Date(a._createdAt || 0);
        const dateB = new Date(b._createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        console.error("Error sorting movies:", error);
        return 0;
      }
    });

    // Return a limited number of movies based on device
    return sortedMovies.slice(0, isMobileView ? 3 : 5);
  }, [movies, isMobileView]);

  // Add fade-in effect when component mounts or data loads
  useEffect(() => {
    if (!isLoading && movies) {
      // Small delay for smooth animation
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, movies]);

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
          onClick={() => refreshMovieCache()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <main className="bg-black min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-screen text-white">
          <div className="bg-black p-8 rounded-lg max-w-md w-full mx-auto text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold mb-4">No Movies Found</h1>
            <p className="text-gray-400 mb-8">
              Your collection is empty. Add your first movie to get started.
            </p>

            <StandaloneAddMovieButton />
          </div>
        </div>
      </main>
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
          {/* Use the separated carousel component */}
          <MovieCarousel movies={moviesToDisplay} />

          {/* Gradient overlay to create seamless transition to movies section */}
          <div className="hidden md:block absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent"></div>
        </div>

        {/* Simply render the Movies component without passing any props */}
        <div
          className={`transition-opacity duration-300 ${
            contentVisible ? "opacity-100 animate-pureFade" : "opacity-0"
          }`}
        >
          <Movies onMovieAdded={refreshMovieCache} />
        </div>
      </div>
    </main>
  );
}
