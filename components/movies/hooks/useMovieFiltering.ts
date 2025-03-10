import { useState, useEffect } from "react";
import { Movie } from "@/typings";
import { applyMovieFilter } from "../MovieFilters";

interface UseMovieFilteringProps {
  moviesData: Movie[] | undefined;
  searchFilteredMovies: Movie[];
  debouncedSearchTerm: string;
}

interface UseMovieFilteringReturn {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  filteredMovies: Movie[];
  handleSortByAverageRating: (filter: string) => void;
}

function useMovieFiltering({
  moviesData,
  searchFilteredMovies,
  debouncedSearchTerm,
}: UseMovieFilteringProps): UseMovieFilteringReturn {
  const [activeFilter, setActiveFilter] = useState("newest");
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setFilteredMovies(searchFilteredMovies);
      return;
    }

    if (moviesData && Array.isArray(moviesData)) {
      const filtered = applyMovieFilter([...moviesData], activeFilter);
      setFilteredMovies(filtered);
    }
  }, [moviesData, searchFilteredMovies, debouncedSearchTerm, activeFilter]);

  function handleSortByAverageRating(filter: string) {
    setActiveFilter(filter);

    if (!moviesData) return;

    if (debouncedSearchTerm) {
      return;
    }

    const filteredData = applyMovieFilter([...moviesData], filter);
    setFilteredMovies(filteredData);
  }

  return {
    activeFilter,
    setActiveFilter,
    filteredMovies,
    handleSortByAverageRating,
  };
}

export default useMovieFiltering;
