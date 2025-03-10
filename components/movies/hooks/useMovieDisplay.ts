import { useState, useEffect, useMemo } from "react";
import { Movie } from "@/typings";

interface UseMovieDisplayProps {
  filteredMovies: Movie[];
  isMobile: boolean;
  debouncedSearchTerm: string;
  activeFilter: string;
}

interface UseMovieDisplayReturn {
  optimizedMovies: Movie[];
  setOptimizedMovies: (movies: Movie[]) => void;
  moviesToDisplay: Movie[];
}

function useMovieDisplay({
  filteredMovies,
  isMobile,
  debouncedSearchTerm,
  activeFilter,
}: UseMovieDisplayProps): UseMovieDisplayReturn {
  const [optimizedMovies, setOptimizedMovies] = useState<Movie[]>([]);

  const moviesToDisplay = useMemo(() => {
    return filteredMovies;
  }, [filteredMovies]);

  useEffect(() => {
    if (isMobile) {
      setOptimizedMovies(filteredMovies.slice(0, 10));
    } else {
      setOptimizedMovies(filteredMovies);
    }
  }, [filteredMovies, isMobile, debouncedSearchTerm, activeFilter]);

  return {
    optimizedMovies,
    setOptimizedMovies,
    moviesToDisplay,
  };
}

export default useMovieDisplay;
