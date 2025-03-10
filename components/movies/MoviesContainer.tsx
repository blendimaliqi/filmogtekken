import React, { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { Movie } from "@/typings";
import { useMovies } from "@/hooks";
import SearchAndFilter from "./SearchAndFilter";
import MovieGrid from "./MovieGrid";
import AddMovieModal from "./AddMovieModal";
import useMovieSearch from "./hooks/useMovieSearch";
import useMovieFiltering from "./hooks/useMovieFiltering";
import useMovieDisplay from "./hooks/useMovieDisplay";
import useMovieAddition from "./hooks/useMovieAddition";
import useDeviceDetection from "./hooks/useDeviceDetection";

interface MoviesContainerProps {
  isAddMovieModalOpen?: boolean;
  onMovieAdded?: () => void;
  filterGenre?: string;
}

function MoviesContainer({
  isAddMovieModalOpen = false,
  onMovieAdded,
  filterGenre,
}: MoviesContainerProps) {
  const { data: session } = useSession();
  const { data: moviesData, isLoading: isMoviesLoading } =
    useMovies(filterGenre);
  const { isMobile } = useDeviceDetection();

  const [tempFilteredMovies, setTempFilteredMovies] = useState<Movie[]>([]);
  const [tempOptimizedMovies, setTempOptimizedMovies] = useState<Movie[]>([]);

  const {
    isModalOpen,
    setIsModalOpen,
    isLoading,
    addMovie,
    openModal,
    closeModal,
  } = useMovieAddition({
    moviesData,
    onMovieAdded,
    setFilteredMovies: setTempFilteredMovies,
    setOptimizedMovies: setTempOptimizedMovies,
  });

  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    tmdbMovies,
    input,
    setInput,
    hasSearched,
    setHasSearched,
    isLoading: isSearchLoading,
    setIsLoading: setIsSearchLoading,
    getMovieRequest,
    filterBySearchTerm,
  } = useMovieSearch({
    moviesData,
    isMobile,
    isModalOpen,
  });

  const searchFilteredMovies = moviesData ? filterBySearchTerm(moviesData) : [];

  const {
    activeFilter,
    setActiveFilter,
    filteredMovies,
    handleSortByAverageRating,
  } = useMovieFiltering({
    moviesData,
    searchFilteredMovies,
    debouncedSearchTerm,
  });

  const { optimizedMovies, setOptimizedMovies, moviesToDisplay } =
    useMovieDisplay({
      filteredMovies,
      isMobile,
      debouncedSearchTerm,
      activeFilter,
    });

  useEffect(() => {
    setTempFilteredMovies(filteredMovies);
    setTempOptimizedMovies(optimizedMovies);
  }, [filteredMovies, optimizedMovies]);

  useEffect(() => {
    if (isAddMovieModalOpen) {
      setIsModalOpen(true);
    }
  }, [isAddMovieModalOpen, setIsModalOpen]);

  const isPageLoading = isLoading && (!moviesData || moviesData.length === 0);

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
        <SearchAndFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilter={activeFilter}
          handleSortByAverageRating={handleSortByAverageRating}
          getMovieRequest={getMovieRequest}
          openModal={openModal}
          session={session}
        />

        <MovieGrid
          optimizedMovies={optimizedMovies}
          isMobile={isMobile}
          moviesToDisplay={moviesToDisplay}
          setOptimizedMovies={setOptimizedMovies}
        />
      </div>

      <AddMovieModal
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        input={input}
        setInput={setInput}
        getMovieRequest={getMovieRequest}
        isLoading={isLoading}
        hasSearched={hasSearched}
        tmdbMovies={tmdbMovies}
        addMovie={addMovie}
      />

      <ToastContainer limit={3} />
    </div>
  );
}

export default MoviesContainer;
