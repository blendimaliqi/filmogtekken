import React, { useState } from "react";
import { toast } from "react-toastify";
import { client, createPost } from "@/config/client";
import { uploadExternalImage } from "@/utils/helperFunctions";
import { useQueryClient } from "@tanstack/react-query";
import { movieKeys } from "@/hooks/useMovie";
import CustomToast from "./ui/CustomToast";
import ModalMovie from "./modal/ModalMovie";
import type { Movie } from "@/typings";

interface AddMovieModalProps {
  onClose: () => void;
  isMobile: boolean;
}

export function AddMovieModal({ onClose, isMobile }: AddMovieModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [tmdbMovies, setTmdbMovies] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const queryClient = useQueryClient();

  const searchMovies = async () => {
    if (!input) return;

    setHasSearched(true);
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${input}&page=1&include_adult=false`
      );
      const data = await response.json();

      // Limit results on mobile
      const results = isMobile ? data.results.slice(0, 10) : data.results;
      setTmdbMovies(results);
    } catch (error) {
      console.error("Error searching TMDB:", error);
      toast.error(({ closeToast }) => (
        <CustomToast
          title="Feil"
          message="Det oppstod en feil ved søk etter filmer. Prøv igjen senere."
          type="error"
          closeToast={closeToast}
        />
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const addMovie = async (movie: any) => {
    try {
      setIsLoading(true);

      // Fetch movie details
      const detailsResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.TMDB_API_KEY}`
      );
      const details = await detailsResponse.json();

      // Upload images
      const [posterAsset, backdropAsset] = await Promise.all([
        uploadExternalImage(
          `https://image.tmdb.org/t/p/original${movie.poster_path}`
        ),
        uploadExternalImage(
          `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        ),
      ]);

      const movieData = {
        _type: "movie",
        title: movie.title,
        releaseDate: movie.release_date,
        slug: {
          _type: "slug",
          current: movie.title,
        },
        genres: details.genres.map((genre: any) => genre.name),
        length: details.runtime,
        plot: movie.overview,
        poster: {
          _type: "image",
          asset: {
            _ref: posterAsset._id,
            _type: "reference",
          },
        },
        poster_backdrop: {
          _type: "image",
          asset: {
            _ref: backdropAsset._id,
            _type: "reference",
          },
        },
      };

      // Create movie in Sanity
      const createdMovie = await createPost(movieData);

      // Show success message
      toast.success(({ closeToast }) => (
        <CustomToast
          title="Film lagt til"
          message={`${movie.title} er nå lagt til i din samling`}
          type="success"
          closeToast={closeToast}
          posterUrl={movie.poster}
        />
      ));

      // Update cache and refetch
      queryClient.invalidateQueries(movieKeys.all);
      queryClient.refetchQueries(movieKeys.lists());

      onClose();
    } catch (error) {
      console.error("Error adding movie:", error);
      toast.error(({ closeToast }) => (
        <CustomToast
          title="Feil"
          message="Det oppstod en feil ved tillegging av filmen. Prøv igjen senere."
          type="error"
          closeToast={closeToast}
        />
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              searchMovies();
            }
          }}
          className="w-full pl-12 pr-14 py-4 bg-gray-800/80 backdrop-blur-sm text-white rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 shadow-lg"
        />
        <button
          onClick={searchMovies}
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
          {tmdbMovies.length > 0 && (
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
                Skriv inn tittel på filmen du vil legge til i samlingen din
              </p>
            </div>
          ) : tmdbMovies.length > 0 ? (
            tmdbMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => addMovie(movie)}
                className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg overflow-hidden group"
              >
                <ModalMovie
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
  );
}
