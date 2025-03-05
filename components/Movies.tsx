import React, { useEffect, useState, useCallback } from "react";
import MovieComponent from "./Movie";
import { client, createPost } from "@/config/client";
import { Modal } from "./modal/Modal";
import ModalMovie from "./modal/ModalMovie";
import { ColorRing } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  centerStyle,
  moviesAtom,
  moviesSortedAtom,
  moviesFilteredAtom,
} from "@/pages";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { atom, useAtom } from "jotai";
import { signIn, useSession } from "next-auth/react";
import { moviesQuery } from "@/utils/groqQueries";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import type { Movie } from "@/typings";
import { movieKeys } from "@/hooks/useMovie";

interface MovieWithAverageRating extends Movie {
  averageRating: number;
}

interface MovieWithTotalComments extends Movie {
  totalComments: number;
}

export const searchTermJotai = atom("");

interface MoviesProps {
  movies?: Movie[];
}

function Movies({ movies: propMovies }: MoviesProps) {
  const [movies, setMovies] = useAtom(moviesAtom);
  const [sortMovies, setSortedMovies] = useAtom(moviesSortedAtom);
  const [moviesFiltered, setMoviesFiltered] = useAtom(moviesFilteredAtom);
  const [searchTerm, setSearchTerm] = useAtom(searchTermJotai);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const [tmdbMovies, setTmdbMovies] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const queryClient = useQueryClient();

  // Use propMovies if provided, otherwise use the movies from the atom
  const moviesToUse = propMovies || movies;

  // Search functionality
  const getMovieRequest = useCallback(() => {
    try {
      // For regular search in the main page
      if (!isModalOpen) {
        if (searchTerm !== "") {
          const searchResults = moviesToUse.filter((movie: Movie) =>
            movie.title.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setSortedMovies(searchResults);
        } else {
          setSortedMovies([]);
        }
        return;
      }

      // For TMDB search in the modal
      if (isModalOpen) {
        // Only set hasSearched to true, indicating a search was performed
        setHasSearched(true);

        if (input !== "") {
          setIsLoading(true);
          // Call TMDB API to search for movies
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${input}&page=1&include_adult=false`
          )
            .then((response) => response.json())
            .then((data) => {
              setTmdbMovies(data.results);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error("Error searching TMDB:", error);
              setIsLoading(false);
            });
        } else {
          // Only clear results if the user explicitly searches with empty input
          setTmdbMovies([]);
        }
      }
    } catch (error) {
      console.error("Error searching movies:", error);
      setIsLoading(false);
    }
  }, [
    searchTerm,
    moviesToUse,
    setSortedMovies,
    isModalOpen,
    input,
    setTmdbMovies,
    setIsLoading,
    setHasSearched,
  ]);

  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  // Add useEffect to trigger search when searchTerm changes
  useEffect(() => {
    if (searchTerm !== "") {
      getMovieRequest();
    } else if (searchTerm === "" && !isModalOpen) {
      setSortedMovies([]);
    }
  }, [searchTerm, getMovieRequest, isModalOpen, setSortedMovies]);

  const {
    isLoading: queryLoading,
    error,
    data,
  } = useQuery({
    queryKey: ["movies"],
    queryFn: () => client.fetch(moviesQuery),
    onSuccess: (data) => {
      // Only update if we don't have propMovies
      if (!propMovies || propMovies.length === 0) {
        setMovies(data);
        setAllMovies(data);
      }
      setIsContentLoaded(true);
    },
    // Disable the query when propMovies is provided
    enabled: !propMovies || propMovies.length === 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const [selectValue, setSelectValue] = useAtom(moviesFilteredAtom);

  const openModal = () => {
    setIsModalOpen(true);
    setHasSearched(false);
    setInput("");
    setTmdbMovies([]);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setInput("");
    setTmdbMovies([]);
    setHasSearched(false);
  };

  async function refetchMovies() {
    try {
      const refetchedData = await client.fetch(moviesQuery);
      setMovies(refetchedData);
      setAllMovies(refetchedData);
      // Reset sorted movies to show the newly added movie
      setSortedMovies([]);
      return refetchedData;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  async function addMovie(mov: any) {
    try {
      setIsLoading(true);
      const movieDetails = `https://api.themoviedb.org/3/movie/${mov.id}?api_key=${process.env.TMDB_API_KEY}`;
      const fetchDetails = await fetch(movieDetails);
      const responeDetails = await fetchDetails.json();
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

      const movieExists = movies.some(
        (movie: any) => movie.title === mov.title
      );

      if (!movieExists) {
        console.log("Created movie:", mov);

        toast.success(`${mov.title} lagt til 😁`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });

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
        const updatedMovies = [newMovieWithId, ...movies];
        setMovies(updatedMovies);
        setAllMovies([newMovieWithId, ...allMovies]);

        // Reset the sorted movies to show the newly added movie
        setSortedMovies([]);

        // Clear the search results
        setTmdbMovies([]);
        setInput("");

        // Invalidate the React Query cache
        queryClient.invalidateQueries(movieKeys.all);

        // Refetch the movies query
        queryClient.refetchQueries(movieKeys.lists());

        // Also directly refetch movies to update the UI
        refetchMovies()
          .then(() => {
            console.log("Movies refetched successfully");
          })
          .catch((error) => {
            console.error("Error refetching movies:", error);
          });

        // Close the modal and reset loading state
        closeModal();
        setIsLoading(false);
      } else {
        toast.error(`${mov.title} finnes allerede 😅`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
        setIsLoading(false);
        closeModal();
      }
    } catch (error) {
      console.log("error", error);
      setIsLoading(false);
      toast.error(
        "Det oppstod en feil ved tillegging av filmen. Prøv igjen senere.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        }
      );
    }
  }

  function filterMoviesByHighestAverageRating(
    moviesToFilter: Movie[]
  ): MovieWithAverageRating[] {
    return moviesToFilter
      .map((movie) => {
        const ratings = movie.ratings || [];
        const totalRatings = ratings.length;
        const sumRatings = ratings.reduce(
          (sum, rating) => sum + rating.rating,
          0
        );
        const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

        return {
          ...movie,
          averageRating,
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating);
  }

  function filterMoviesByLowestAverageRating(
    moviesToFilter: Movie[]
  ): MovieWithAverageRating[] {
    return moviesToFilter
      .map((movie) => {
        const ratings = movie.ratings || [];
        const totalRatings = ratings.length;
        const sumRatings = ratings.reduce(
          (sum, rating) => sum + rating.rating,
          0
        );
        const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

        return {
          ...movie,
          averageRating,
        };
      })
      .sort((a, b) => a.averageRating - b.averageRating);
  }

  function filterMoviesByHighestTotalComments(
    moviesToFilter: Movie[]
  ): MovieWithTotalComments[] {
    return moviesToFilter
      .map((movie) => {
        const totalComments = movie.comments ? movie.comments.length : 0;
        return {
          ...movie,
          totalComments,
        };
      })
      .sort((a, b) => b.totalComments - a.totalComments);
  }

  const handleSortByAverageRating = (filter: string) => {
    if (filter === "highest") {
      const sortedByHighestRating =
        filterMoviesByHighestAverageRating(moviesToUse);
      setSortedMovies(sortedByHighestRating);
    } else if (filter === "lowest") {
      const sortedByLowestRating =
        filterMoviesByLowestAverageRating(moviesToUse);
      setSortedMovies(sortedByLowestRating);
    } else if (filter === "comments") {
      const sortedByComments = filterMoviesByHighestTotalComments(moviesToUse);
      setSortedMovies(sortedByComments);
    } else if (filter === "default") {
      setSortedMovies([]);
    }
  };

  // Determine the overall loading state
  const isPageLoading =
    queryLoading && (!propMovies || propMovies.length === 0);

  // Show loading spinner if loading and no propMovies
  if (isPageLoading) {
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

  // Create a displayMovies variable to simplify the rendering logic
  const displayMovies = sortMovies.length > 0 ? sortMovies : moviesToUse;

  return (
    <div className="bg-black min-h-screen">
      <div className="container mx-auto py-8">
        {/* Search and filter section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 px-8">
          {/* Search input */}
          <div className="relative w-full md:w-96 mb-4 md:mb-0">
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

          {/* Filter dropdown */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                className="appearance-none bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                value={moviesFiltered}
                onChange={(e) => handleSortByAverageRating(e.target.value)}
              >
                <option value="default">Sist lagt til</option>
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

            {/* Add movie button */}
            {session ? (
              <button
                onClick={openModal}
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-medium py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 flex items-center"
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
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 flex flex-col items-center"
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

        {/* Movie grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-8 pb-8">
          {displayMovies.map((movie: any) => (
            <MovieComponent
              key={uuidv4()}
              title={movie.title}
              year={movie.year}
              poster={movie.poster.asset}
              movie={movie}
            />
          ))}
        </div>
      </div>

      {/* Modal for adding movies */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="flex flex-col justify-center items-center z-50 p-8 bg-gradient-to-b from-gray-900 to-black">
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
                const value = e.target.value;
                setInput(value);
                // Don't clear results when input is emptied
              }}
              className="w-full pl-12 pr-14 py-4 bg-gray-800/80 backdrop-blur-sm text-white rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 shadow-lg"
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
              <h3 className="text-lg font-medium text-white">Søkeresultater</h3>
              {tmdbMovies && tmdbMovies.length > 0 && (
                <span className="text-sm text-gray-400">
                  {tmdbMovies.length} filmer funnet
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-8 pb-8 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="fixed inset-0 flex justify-center items-center bg-black/70 backdrop-blur-sm z-50">
              <ColorRing
                visible={true}
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"]}
              />
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
                Skriv inn tittel på filmen du vil legge til i samlingen din
              </p>
            </div>
          ) : tmdbMovies && tmdbMovies.length > 0 ? (
            tmdbMovies.map((movie: any) => (
              <div
                key={uuidv4()}
                onClick={() => addMovie(movie)}
                className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg overflow-hidden group"
              >
                <ModalMovie
                  key={uuidv4()}
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
      </Modal>

      <ToastContainer />
    </div>
  );
}
export default Movies;
