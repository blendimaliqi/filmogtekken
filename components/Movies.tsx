import React, { useEffect, useState } from "react";
import Movie from "./Movie";
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
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom } from "jotai";
import { signIn, useSession } from "next-auth/react";
import { moviesQuery } from "@/utils/groqQueries";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";

export const searchTermJotai = atom("");
function Movies() {
  const [movies, setMovies] = useAtom(moviesAtom);
  const [sortMovies, setSortedMovies] = useAtom(moviesSortedAtom);

  const [allMovies, setAllMovies] = useState<any[]>([]);

  const { isLoading, error, data } = useQuery({
    queryKey: ["movies"],
    queryFn: () => client.fetch(moviesQuery),
    onSuccess: () => {
      setMovies(data);
      setAllMovies(data);
    },
  });
  const { data: session, status } = useSession();

  const [tmdbMovies, setTmdbMovies] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [selectValue, setSelectValue] = useAtom(moviesFilteredAtom);

  const [searchTerm, setSearchTerm] = useAtom(searchTermJotai);

  const getMovieRequest = async () => {
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${input}&page=1&include_adult=false`;

      const response = await fetch(url);
      const responseJson = await response.json();
      setTmdbMovies(responseJson.results);
    } catch (error) {
      console.log("error", error);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [loading, setLoading] = useState(false);

  async function refetchMovies() {
    try {
      const refetchedData = await client.fetch(moviesQuery);
      setMovies(refetchedData);
    } catch (error) {
      console.log("error", error);
    }
  }

  async function addMovie(mov: any) {
    try {
      setLoading(true);
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
        setLoading(false);
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

        closeModal();
        await createPost(movieData);
        const newMovies: any = [...movies, movieData];
        setMovies(newMovies);
        refetchMovies();
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
        setLoading(false);
        closeModal();
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  useEffect(() => {
    if (searchTerm === "") {
      // If the search bar is empty, show all movies
      setMovies(allMovies);
    } else {
      // If there's a search term, filter movies based on it
      const results = movies.filter((movie: any) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSortedMovies([]);
      setMovies(results);
    }
  }, [searchTerm, allMovies]);

  function filterMoviesByHighestAverageRating(movies: any) {
    const moviesWithAverageRating = movies.map((movie: any) => {
      const ratings = movie.ratings;

      const averageRating = ratings
        ? ratings.reduce((a: any, b: any) => a + b.rating, 0) / ratings.length
        : 0;
      return { ...movie, averageRating };
    });

    const sortedMovies = moviesWithAverageRating.sort((a: any, b: any) => {
      return b.averageRating - a.averageRating;
    });

    return sortedMovies;
  }

  function filterMoviesByLowestAverageRating(movies: any) {
    const moviesWithAverageRating = movies.map((movie: any) => {
      const ratings = movie.ratings;

      const averageRating = ratings
        ? ratings.reduce((a: any, b: any) => a + b.rating, 0) / ratings.length
        : 0;
      return { ...movie, averageRating };
    });

    const sortedMovies = moviesWithAverageRating.sort((a: any, b: any) => {
      return a.averageRating - b.averageRating;
    });

    return sortedMovies;
  }

  function fulterMoviesByHighestTotalComments(movies: any) {
    const moviesWithTotalComments = movies.map((movie: any) => {
      const comments = movie.comments;

      const totalComments = comments ? comments.length : 0;
      return { ...movie, totalComments };
    });

    const sortedMovies = moviesWithTotalComments.sort((a: any, b: any) => {
      return b.totalComments - a.totalComments;
    });

    return sortedMovies;
  }

  if (movies.length === 0 && !isLoading && searchTerm !== "")
    return (
      <div
        draggable={false}
        className="flex flex-col justify-center items-center h-screen w-screen"
      >
        <div>
          <h2 className="text-2xl font-bold mb-6 sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
            Ingen filmer
          </h2>
        </div>
      </div>
    );

  const handleSortByAverageRating = (filter: string) => {
    setSelectValue(filter);
    if (filter == "highestRating") {
      const sorted = filterMoviesByHighestAverageRating(movies);
      setSortedMovies(sorted);
    } else if (filter == "lowestRating") {
      const sorted = filterMoviesByLowestAverageRating(movies);
      setSortedMovies(sorted);
    } else if (filter == "highestComments") {
      const sorted = fulterMoviesByHighestTotalComments(movies);
      setSortedMovies(sorted);
    } else {
      setSortedMovies([]);
    }
  };

  return (
    <div draggable={false} className="min-h-screen">
      {/* Search and filter section - redesigned to be more subtle */}
      <div className="w-full bg-gradient-to-b from-black to-transparent py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-end items-center space-y-6 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Søk filmer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-800/60 backdrop-blur-sm text-white rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Filter dropdown */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectValue}
                  onChange={(e) => {
                    const selectedOption = e.target.value;
                    handleSortByAverageRating(selectedOption);
                  }}
                  className="w-full pl-4 pr-10 py-3 bg-gray-800/60 backdrop-blur-sm text-white rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
                >
                  <option value="default">Sist lagt til</option>
                  <option value="highestRating">Høyest vurdering</option>
                  <option value="lowestRating">Lavest vurdering</option>
                  <option value="highestComments">Flest kommentarer</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movie grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-8 md:gap-10">
          {/* Add movie button */}
          <div className="flex items-stretch h-full">
            {session && status === "authenticated" ? (
              <button
                className="w-full h-full aspect-[2/3] bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg p-6 flex flex-col items-center justify-center space-y-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-gray-800/30 group"
                onClick={openModal}
              >
                <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-medium text-lg text-center">Legg til film</span>
                <p className="text-sm text-gray-400 text-center">Søk etter og legg til nye filmer i samlingen</p>
              </button>
            ) : (
              <button
                className="w-full h-full aspect-[2/3] bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg p-6 flex flex-col items-center justify-center space-y-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-gray-800/30 group"
                onClick={() => signIn()}
              >
                <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="font-medium text-lg text-center">Logg inn for å legge til filmer</span>
                <p className="text-sm text-gray-400 text-center">Du må være logget inn for å legge til nye filmer</p>
              </button>
            )}
          </div>

          {/* Movie cards */}
          {(sortMovies.length > 0 ? sortMovies : movies).map((movie: any) => (
            <Movie
              key={uuidv4()}
              title={movie.title}
              year={movie.year}
              poster={movie.poster.asset}
              movie={movie}
            />
          ))}
        </div>
      </div>

      {/* No results message */}
      {movies.length === 0 && !isLoading && searchTerm !== "" && (
        <div className="flex flex-col justify-center items-center py-16">
          <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Ingen filmer</h2>
          <p className="text-gray-400 mt-2">Prøv å søke etter noe annet</p>
        </div>
      )}

      {/* Modal for adding movies */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="flex flex-col justify-center items-center z-50 p-8 bg-gradient-to-b from-gray-900 to-black">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Legg til film</h2>
          </div>
          
          <div className="relative w-full max-w-lg mb-10">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
              onChange={(e) => setInput(e.target.value)}
              className="w-full pl-12 pr-14 py-4 bg-gray-800/80 backdrop-blur-sm text-white rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-lg"
            />
            <button 
              onClick={getMovieRequest}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          
          <div className="w-full border-t border-gray-800 mb-6"></div>
          
          <div className="w-full">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-lg font-medium text-white">Søkeresultater</h3>
              {tmdbMovies && tmdbMovies.length > 0 && (
                <span className="text-sm text-gray-400">{tmdbMovies.length} filmer funnet</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-8 pb-8 max-h-[60vh] overflow-y-auto">
          {loading ? (
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
          ) : input === "" ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="bg-blue-600/20 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Søk etter filmer</h2>
              <p className="text-gray-400 mt-2 max-w-md">Skriv inn tittel på filmen du vil legge til i samlingen din</p>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-medium text-white mb-2">Ingen filmer funnet</p>
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
