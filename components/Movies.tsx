import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { signIn, useSession } from "next-auth/react";
import type { Movie } from "@/typings";
import { MovieSearch } from "./MovieSearch";
import { MovieFilter } from "./MovieFilter";
import { MovieGrid } from "./MovieGrid";
import { AddMovieModal } from "./AddMovieModal";
import { useMovieManagement } from "@/hooks/useMovieManagement";

// Dynamically import the Modal component
const ModalComponent = dynamic(
  () => import("./modal/Modal").then((mod) => mod.Modal),
  { ssr: false }
);

interface MoviesProps {
  movies?: Movie[];
}

function Movies({ movies: propMovies }: MoviesProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();

  const { movies, sortedMovies, isLoading, handleSortByAverageRating } =
    useMovieManagement(propMovies);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show loading spinner if loading and no propMovies
  if (isLoading && (!propMovies || propMovies.length === 0)) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500" />
        </div>
      </div>
    );
  }

  const moviesToDisplay = sortedMovies.length > 0 ? sortedMovies : movies;

  return (
    <div className="bg-black min-h-screen">
      <div className="container mx-auto py-4 md:py-8">
        {/* Search and filter section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 px-4 md:px-8 space-y-4 md:space-y-0 pt-2 md:pt-0">
          <MovieSearch />

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <MovieFilter onFilterChange={handleSortByAverageRating} />

            {session ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-medium py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 flex items-center justify-center"
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
                className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 flex flex-col items-center"
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

        <MovieGrid movies={moviesToDisplay} isMobile={isMobile} />
      </div>

      {isModalOpen && (
        <ModalComponent
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <AddMovieModal
            onClose={() => setIsModalOpen(false)}
            isMobile={isMobile}
          />
        </ModalComponent>
      )}

      <ToastContainer limit={3} />
    </div>
  );
}

export default Movies;
