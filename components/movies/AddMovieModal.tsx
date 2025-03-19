import React from "react";
import dynamic from "next/dynamic";
import { uuidv4 } from "@/utils/helperFunctions";

// Dynamically import the Modal component
const ModalComponent = dynamic(
  () => import("../modal/Modal").then((mod) => mod.Modal),
  { ssr: false }
);
const ModalMovie = dynamic(() => import("../modal/ModalMovie"), { ssr: false });

interface AddMovieModalProps {
  isModalOpen: boolean;
  closeModal: () => void;
  input: string;
  setInput: (input: string) => void;
  getMovieRequest: () => void;
  isLoading: boolean;
  hasSearched: boolean;
  tmdbMovies: any[];
  addMovie: (movie: any) => Promise<void>;
}

function AddMovieModal({
  isModalOpen,
  closeModal,
  input,
  setInput,
  getMovieRequest,
  isLoading,
  hasSearched,
  tmdbMovies,
  addMovie,
}: AddMovieModalProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      getMovieRequest();
    }
  }

  // Return null instead of false if modal is not open
  if (!isModalOpen) {
    return null;
  }

  return (
    <ModalComponent isOpen={isModalOpen} onClose={closeModal}>
      <div className="flex flex-col justify-center items-center z-[10000000] p-3 sm:p-6 md:p-8 bg-gradient-to-b from-gray-900 to-black">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8 w-full">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white"
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            Legg til film
          </h2>
        </div>

        <div className="relative w-full mb-6 sm:mb-8 md:mb-10">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
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
            onKeyDown={handleKeyDown}
            onChange={(e) => setInput(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-14 py-3 sm:py-4 bg-gray-800/80 backdrop-blur-sm text-white rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 shadow-lg text-sm sm:text-base"
            value={input}
          />
          <button
            onClick={getMovieRequest}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-600 hover:bg-yellow-500 text-white p-2 sm:p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5"
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

        <div className="w-full border-t border-gray-800 mb-4 sm:mb-6"></div>

        <div className="w-full">
          <div className="flex justify-between items-center mb-3 sm:mb-4 px-0 sm:px-2">
            <h3 className="text-base sm:text-lg font-medium text-white">
              Søkeresultater
            </h3>
            {tmdbMovies && tmdbMovies.length > 0 && (
              <span className="text-xs sm:text-sm text-gray-400">
                {tmdbMovies.length} filmer funnet
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 px-0 sm:px-2 pb-4 sm:pb-6 max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-[3px] sm:border-[4px] border-gray-600 border-t-yellow-500"></div>
              </div>
            ) : !hasSearched ? (
              <div className="col-span-full flex flex-col items-center justify-center py-8 sm:py-16 px-4 text-center">
                <div className="bg-yellow-600/20 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 sm:h-10 sm:w-10 text-yellow-500"
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
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Søk etter filmer
                </h2>
                <p className="text-sm sm:text-base text-gray-400 mt-2 max-w-md">
                  Skriv inn tittel på filmen du vil legge til i samlingen din
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
              <div className="col-span-full flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-800/80 flex items-center justify-center mb-3 sm:mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400"
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
                <p className="text-lg sm:text-xl font-medium text-white mb-2">
                  Ingen filmer funnet
                </p>
                <p className="text-sm sm:text-base text-gray-400">
                  Prøv å søke etter noe annet
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button - only visible on small screens */}
          <button
            onClick={closeModal}
            className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg flex items-center justify-center sm:hidden"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Lukk
          </button>
        </div>
      </div>
    </ModalComponent>
  );
}

export default AddMovieModal;
