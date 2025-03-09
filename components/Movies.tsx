import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import dynamic from "next/dynamic";
import { client, createPost } from "@/config/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { centerStyle } from "@/pages";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { signIn, useSession } from "next-auth/react";
import { moviesQuery } from "@/utils/groqQueries";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import type { Movie } from "@/typings";
import { movieKeys } from "@/hooks/useMovie";
import CustomToast from "./ui/CustomToast";
import { useMovies } from "@/hooks";

// Dynamically import the Modal and ModalMovie components to reduce initial load time
const ModalComponent = dynamic(
  () => import("./modal/Modal").then((mod) => mod.Modal),
  { ssr: false }
);
const ModalMovie = dynamic(() => import("./modal/ModalMovie"), { ssr: false });
// Use dynamic import for MovieComponent with SSR disabled for better mobile performance
const MovieComponent = dynamic(() => import("./Movie"), { ssr: false });

interface MovieWithAverageRating extends Movie {
  averageRating: number;
}

interface MovieWithTotalComments extends Movie {
  totalComments: number;
}

interface MoviesProps {
  isAddMovieModalOpen?: boolean;
  onMovieAdded?: () => void;
  filterGenre?: string;
}

function Movies({
  isAddMovieModalOpen = false,
  onMovieAdded,
  filterGenre,
}: MoviesProps) {
  // Local state
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [totalMovies, setTotalMovies] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("newest");
  const [filteredMovies, setFilteredMovies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(isAddMovieModalOpen);
  const { data: session } = useSession();
  const [tmdbMovies, setTmdbMovies] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(false);

  // Fetch movies directly with React Query
  const {
    data: moviesData,
    isLoading: isMoviesLoading,
    error,
  } = useMovies(filterGenre);

  // Use movies directly from React Query
  const moviesToUse = useMemo(() => {
    return moviesData || [];
  }, [moviesData]);

  // Open the modal if isAddMovieModalOpen prop changes
  useEffect(() => {
    if (isAddMovieModalOpen) {
      setIsModalOpen(true);
    }
  }, [isAddMovieModalOpen]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Memoize filter functions for better performance
  const filterMoviesByHighestAverageRating = useMemo(
    () =>
      (moviesToFilter: Movie[]): MovieWithAverageRating[] => {
        return moviesToFilter
          .map((movie) => {
            const ratings = movie.ratings || [];
            const totalRatings = ratings.length;
            const sumRatings = ratings.reduce(
              (sum, rating) => sum + rating.rating,
              0
            );
            const averageRating =
              totalRatings > 0 ? sumRatings / totalRatings : 0;

            return {
              ...movie,
              averageRating,
            };
          })
          .sort((a, b) => b.averageRating - a.averageRating);
      },
    []
  );

  const filterMoviesByLowestAverageRating = useMemo(
    () =>
      (moviesToFilter: Movie[]): MovieWithAverageRating[] => {
        return moviesToFilter
          .map((movie) => {
            const ratings = movie.ratings || [];
            const totalRatings = ratings.length;
            const sumRatings = ratings.reduce(
              (sum, rating) => sum + rating.rating,
              0
            );
            const averageRating =
              totalRatings > 0 ? sumRatings / totalRatings : 0;

            return {
              ...movie,
              averageRating,
            };
          })
          .sort((a, b) => a.averageRating - b.averageRating);
      },
    []
  );

  const filterMoviesByHighestTotalComments = useMemo(
    () =>
      (moviesToFilter: Movie[]): MovieWithTotalComments[] => {
        return moviesToFilter
          .map((movie) => {
            const totalComments = movie.comments ? movie.comments.length : 0;
            return {
              ...movie,
              totalComments,
            };
          })
          .sort((a, b) => b.totalComments - a.totalComments);
      },
    []
  );

  // Add a new filter by creation date (newest first)
  const filterMoviesByNewest = useMemo(
    () =>
      (moviesToFilter: Movie[]): Movie[] => {
        return [...moviesToFilter].sort((a, b) => {
          // Convert strings to Date objects for proper comparison
          const dateA = new Date(a._createdAt);
          const dateB = new Date(b._createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      },
    []
  );

  // Memoize the handleSortByAverageRating function
  const handleSortByAverageRating = useCallback(
    (filter: string) => {
      // Update the filter state
      setActiveFilter(filter);

      if (filter === "highest") {
        const sortedByHighestRating =
          filterMoviesByHighestAverageRating(moviesToUse);
        setFilteredMovies(sortedByHighestRating);
      } else if (filter === "lowest") {
        const sortedByLowestRating =
          filterMoviesByLowestAverageRating(moviesToUse);
        setFilteredMovies(sortedByLowestRating);
      } else if (filter === "comments") {
        const sortedByComments =
          filterMoviesByHighestTotalComments(moviesToUse);
        setFilteredMovies(sortedByComments);
      } else if (filter === "newest") {
        const sortedByNewest = filterMoviesByNewest(moviesToUse);
        setFilteredMovies(sortedByNewest);
      } else if (filter === "default") {
        setFilteredMovies([]);
      }
    },
    [
      moviesToUse,
      filterMoviesByHighestAverageRating,
      filterMoviesByLowestAverageRating,
      filterMoviesByHighestTotalComments,
      filterMoviesByNewest,
    ]
  );

  // Search functionality - only called on demand, not on every keystroke
  const getMovieRequest = useCallback(() => {
    try {
      // For regular search in the main page
      if (!isModalOpen) {
        if (searchTerm !== "") {
          const searchResults = moviesToUse.filter((movie: Movie) =>
            movie.title.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setFilteredMovies(searchResults);
          setHasSearched(true);
        } else {
          setHasSearched(false);
          if (activeFilter !== "default") {
            // Reapply the active filter when search is cleared
            handleSortByAverageRating(activeFilter);
          } else {
            // Default to newest order if no filter is selected
            const sortedByNewest = filterMoviesByNewest(moviesToUse);
            setFilteredMovies(sortedByNewest);
          }
        }
      }
      // For TMDB search in the modal
      else if (isModalOpen) {
        setHasSearched(true);

        if (input !== "") {
          setIsLoading(true);
          // Call TMDB API to search for movies
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${input}&page=1&include_adult=false`
          )
            .then((response) => response.json())
            .then((data) => {
              // Limit results to improve performance on mobile
              const limitedResults = isMobile
                ? data.results.slice(0, 10)
                : data.results;
              setTmdbMovies(limitedResults);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error("Error searching TMDB:", error);
              setIsLoading(false);
            });
        } else {
          // Clear results if the user explicitly searches with empty input
          setTmdbMovies([]);
        }
      }
    } catch (error) {
      console.error("Error in getMovieRequest:", error);
      setIsLoading(false);
    }
  }, [
    searchTerm,
    moviesToUse,
    isModalOpen,
    activeFilter,
    filterMoviesByNewest,
    handleSortByAverageRating,
    input,
    isMobile,
  ]);

  // Apply active filter when movies change
  useEffect(() => {
    if (activeFilter !== "default") {
      handleSortByAverageRating(activeFilter);
    } else {
      // If no filter is selected, default to the newest movies
      const sortedByNewest = filterMoviesByNewest(moviesToUse);
      setFilteredMovies(sortedByNewest);
    }
  }, [
    moviesToUse,
    activeFilter,
    handleSortByAverageRating,
    filterMoviesByNewest,
  ]);

  // Display loading state while content is loading
  useEffect(() => {
    setIsContentLoaded(true);
  }, []);

  // Function to get the correct movies to display
  const getMoviesToDisplay = (): Movie[] => {
    // If we have filtered movies, show them
    if (filteredMovies.length > 0) {
      return filteredMovies;
    }
    // Otherwise show all movies (might be empty array)
    return moviesToUse;
  };

  // Get the final list of movies to display
  const moviesToDisplay = getMoviesToDisplay();

  // Modal functions
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setInput("");
    setTmdbMovies([]);
    setHasSearched(false);
    setIsModalOpen(false);
  };

  // Function to add a new movie from TMDB
  async function addMovie(mov: any) {
    try {
      setIsLoading(true);
      const movieDetails = `https://api.themoviedb.org/3/movie/${mov.id}?api_key=${process.env.TMDB_API_KEY}`;
      const fetchDetails = await fetch(movieDetails);
      const responeDetails = await fetchDetails.json();

      // Check if this movie already exists before uploading images
      const movieExists = moviesToUse.some(
        (movie: any) => movie.title === mov.title
      );

      if (movieExists) {
        toast.error(
          ({ closeToast }) => (
            <CustomToast
              title="Film finnes allerede"
              message={`${mov.title} er allerede i din samling`}
              type="error"
              closeToast={closeToast}
              posterUrl={mov.poster}
            />
          ),
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "dark",
            className:
              "!bg-transparent !shadow-none !p-0 !rounded-none !max-w-sm",
            bodyClassName: "!p-0 !m-0",
            icon: false,
          }
        );
        setIsLoading(false);
        closeModal();
        return;
      }

      // Only upload images if movie doesn't exist
      const imageUrl = `https://image.tmdb.org/t/p/original${mov.poster_path}`;
      const imageAsset = await uploadExternalImage(imageUrl);
      const imageAssetId = imageAsset._id;

      const imageUrlBackdrop = `https://image.tmdb.org/t/p/original${mov.backdrop_path}`;
      const imageAssetBackdrop = await uploadExternalImage(imageUrlBackdrop);
      const imageAssetIdBackdrop = imageAssetBackdrop._id;

      const movieData = {
        _type: "movie",
        title: mov.title,
        releaseDate: mov.release_date,
        slug: {
          _type: "slug",
          current: mov.title,
        },
        genres: responeDetails.genres.map((genre: any) => genre.name),

        length: responeDetails.runtime,
        plot: mov.overview,

        poster: {
          _type: "image",
          asset: {
            _ref: imageAssetId,
            _type: "reference",
          },
        },
        poster_backdrop: {
          _type: "image",
          asset: {
            _ref: imageAssetIdBackdrop,
            _type: "reference",
          },
        },
      };

      console.log("Created movie:", mov);

      toast.success(
        ({ closeToast }) => (
          <CustomToast
            title="Film lagt til"
            message={`${mov.title} er nå lagt til i din samling`}
            type="success"
            closeToast={closeToast}
            posterUrl={mov.poster}
          />
        ),
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
          className:
            "!bg-transparent !shadow-none !p-0 !rounded-none !max-w-sm",
          bodyClassName: "!p-0 !m-0",
          icon: false,
        }
      );

      // Create the movie in Sanity
      const createdMovie = await createPost(movieData);

      // Add the created movie to both state arrays with the _id from Sanity
      const newMovieWithId = {
        ...movieData,
        _id: createdMovie._id,
        _createdAt: new Date().toISOString(),
        _rev: "",
        _updatedAt: new Date().toISOString(),
        comments: [],
        ratings: [],
        year: new Date(mov.release_date).getFullYear().toString(),
        director: "",
        cast: [],
        overview: { _type: "block", children: [] },
        externalId: mov.id,
        popularity: mov.popularity || 0,
      } as unknown as Movie;

      // Update all state variables that affect the UI
      const updatedMovies = [newMovieWithId, ...moviesToUse];
      setFilteredMovies(updatedMovies);

      // Clear the search results
      setTmdbMovies([]);
      setInput("");

      // Use queryClient to update the cache directly instead of refetching
      queryClient.setQueryData(movieKeys.lists(), (oldData: any) => {
        return oldData ? [newMovieWithId, ...oldData] : [newMovieWithId];
      });

      // Invalidate queries but don't refetch immediately to prevent loops
      queryClient.invalidateQueries({
        queryKey: movieKeys.all,
        refetchType: "none",
      });

      // Close the modal and reset loading state
      closeModal();
      setIsLoading(false);

      // Call the onMovieAdded callback if provided
      if (onMovieAdded) {
        setTimeout(() => {
          onMovieAdded();
        }, 500);
      }
    } catch (error) {
      console.error("Error adding movie:", error);
      toast.error(
        "Det oppstod en feil ved legge til filmen. Prøv igjen senere.",
        {
          position: "bottom-right",
        }
      );
      setIsLoading(false);
      closeModal();
    }
  }

  // Functions to refetch movies - this implementation is much more efficient
  async function refetchMovies() {
    try {
      await queryClient.invalidateQueries({
        queryKey: movieKeys.all,
        refetchType: "none", // Don't refetch immediately
      });

      // Schedule a refetch after a delay to prevent looping
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: movieKeys.lists() });

        // Display success message
        toast.success("Movie list updated successfully!", {
          position: "bottom-right",
        });
      }, 1000);
    } catch (error) {
      console.error("Error refetching movies:", error);
      toast.error("Failed to update movie list.", {
        position: "bottom-right",
      });
    }
  }

  // Initialize optimizedMovies state with proper typing
  const [optimizedMovies, setOptimizedMovies] = useState<Movie[]>([]);

  // Add logging for optimizedDisplayMovies
  const optimizedDisplayMovies = useMemo(() => {
    // Only limit initial batch size on mobile
    if (isMobile) {
      const initialBatchSize = 10;
      return moviesToDisplay.slice(0, initialBatchSize);
    }

    // On desktop, show all movies
    return moviesToDisplay;
  }, [moviesToDisplay, isMobile]);

  // Update optimizedMovies when displayMovies changes
  useEffect(() => {
    setOptimizedMovies(optimizedDisplayMovies);
  }, [optimizedDisplayMovies]);

  // Lazy load more movies as the user scrolls (only on mobile)
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        // Load more movies when user is near the bottom
        const currentCount = optimizedMovies.length;
        const nextBatch = moviesToDisplay.slice(0, currentCount + 10);
        if (nextBatch.length > currentCount) {
          // Only update if there are more movies to show
          setOptimizedMovies(nextBatch);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, moviesToDisplay, optimizedMovies]);

  // Make sure to initialize optimizedMovies even when moviesToUse is empty
  useEffect(() => {
    // Initialize optimizedMovies with an empty array at minimum
    setOptimizedMovies(
      moviesToDisplay.slice(0, isMobile ? 10 : moviesToDisplay.length)
    );
  }, [moviesToDisplay, isMobile]);

  // Determine the overall loading state
  const isPageLoading = isLoading && (!moviesData || moviesData.length === 0);

  // Show loading spinner if loading and no propMovies
  if (isPageLoading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="container mx-auto py-4 md:py-8">
        {/* Search and filter section - always visible regardless of movie count */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 px-4 md:px-8 space-y-4 md:space-y-0 pt-2 md:pt-0">
          {/* Search input */}
          <div className="relative w-full md:w-96 mb-2 md:mb-0">
            <input
              type="text"
              placeholder="Søk etter filmer..."
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  getMovieRequest();
                }
              }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              onClick={getMovieRequest}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 hover:text-yellow-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* Filter dropdown and Add Movie button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto z-10">
              <select
                className="appearance-none w-full sm:w-auto bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                value={activeFilter}
                onChange={(e) => handleSortByAverageRating(e.target.value)}
              >
                <option value="default">Ingen sortering</option>
                <option value="newest">Nyeste først</option>
                <option value="highest">Høyest vurdering</option>
                <option value="lowest">Lavest vurdering</option>
                <option value="comments">Flest kommentarer</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* Add movie button - make it fully interactive with improved styling */}
            {session ? (
              <button
                onClick={openModal}
                className="z-50 w-full sm:w-auto bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-medium py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 flex items-center justify-center cursor-pointer relative hover:scale-105 active:scale-95"
                style={{ position: "relative", pointerEvents: "auto" }}
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Legg til film
              </button>
            ) : (
              <button
                onClick={() => signIn("discord")}
                className="z-50 w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 flex flex-col items-center cursor-pointer relative hover:scale-105 active:scale-95"
                style={{ position: "relative", pointerEvents: "auto" }}
                type="button"
              >
                <div className="flex items-center mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-gray-400"
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
                  <span className="font-medium text-lg">Logg inn</span>
                </div>
                <p className="text-xs text-gray-400">for å legge til filmer</p>
              </button>
            )}
          </div>
        </div>

        {/* Movie grid - optimize for mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 px-4 md:px-8 pb-8">
          {optimizedMovies.map((movie: any) => (
            <MovieComponent
              key={movie._id || uuidv4()}
              title={movie.title}
              year={movie.year}
              poster={movie.poster.asset}
              movie={movie}
            />
          ))}
        </div>

        {/* Show load more button on mobile if there are more movies to display */}
        {isMobile && optimizedMovies.length < moviesToDisplay.length && (
          <div className="flex justify-center pb-8">
            <button
              onClick={() => {
                const currentCount = optimizedMovies.length;
                setOptimizedMovies(moviesToDisplay.slice(0, currentCount + 10));
              }}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Vis flere filmer
            </button>
          </div>
        )}
      </div>

      {/* Modal for adding movies - implement directly without relying on external components */}
      {isModalOpen && (
        <ModalComponent isOpen={isModalOpen} onClose={closeModal}>
          <div className="flex flex-col justify-center items-center z-[100000] p-8 bg-gradient-to-b from-gray-900 to-black">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Legg til film</h2>
            </div>

            <div className="relative w-full max-w-lg mb-10">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Søk etter film..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    getMovieRequest();
                  }
                }}
                onChange={(e) => {
                  // Only update the input value, don't search automatically
                  setInput(e.target.value);
                }}
                className="w-full pl-12 pr-14 py-4 bg-gray-800/80 backdrop-blur-sm text-white rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 shadow-lg"
                value={input}
              />
              <button
                onClick={getMovieRequest}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-600 hover:bg-yellow-500 text-white p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            <div className="w-full border-t border-gray-800 mb-6"></div>

            <div className="w-full">
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-lg font-medium text-white">
                  Søkeresultater
                </h3>
                {tmdbMovies && tmdbMovies.length > 0 && (
                  <span className="text-sm text-gray-400">
                    {tmdbMovies.length} filmer funnet
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2 pb-8 max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="col-span-full flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-[4px] border-gray-600 border-t-yellow-500"></div>
                  </div>
                ) : !hasSearched ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-yellow-600/20 p-4 rounded-full mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-yellow-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Søk etter filmer
                    </h2>
                    <p className="text-gray-400 mt-2 max-w-md">
                      Skriv inn tittel på filmen du vil legge til i samlingen
                      din
                    </p>
                  </div>
                ) : tmdbMovies && tmdbMovies.length > 0 ? (
                  tmdbMovies.map((movie: any) => (
                    <div
                      key={movie.id || uuidv4()}
                      onClick={() => addMovie(movie)}
                      className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg overflow-hidden group"
                    >
                      <ModalMovie
                        key={movie.id || uuidv4()}
                        title={movie.title}
                        year={movie.release_date}
                        id={movie.id}
                        poster={movie.poster_path}
                        movie={movie}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-xl font-medium text-white mb-2">
                      Ingen filmer funnet
                    </p>
                    <p className="text-gray-400">Prøv å søke etter noe annet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalComponent>
      )}

      <ToastContainer limit={3} />
    </div>
  );
}
export default Movies;
