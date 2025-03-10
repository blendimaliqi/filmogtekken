import { useState, useEffect } from "react";
import { Movie } from "@/typings";

interface UseMovieSearchProps {
  moviesData: Movie[] | undefined;
  isMobile: boolean;
  isModalOpen: boolean;
}

interface UseMovieSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;
  tmdbMovies: any[];
  input: string;
  setInput: (input: string) => void;
  hasSearched: boolean;
  setHasSearched: (value: boolean) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  getMovieRequest: () => void;
  filterBySearchTerm: (movies: Movie[]) => Movie[];
}

function useMovieSearch({
  moviesData,
  isMobile,
  isModalOpen,
}: UseMovieSearchProps): UseMovieSearchReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [tmdbMovies, setTmdbMovies] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  function filterBySearchTerm(movies: Movie[]): Movie[] {
    if (!debouncedSearchTerm) return movies;

    return movies.filter((movie: Movie) =>
      movie.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }

  function getMovieRequest() {
    try {
      if (!isModalOpen) {
        setHasSearched(!!debouncedSearchTerm);
      } else if (isModalOpen) {
        if (input !== "") {
          setHasSearched(true);
          setIsLoading(true);
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${input}&page=1&include_adult=false`
          )
            .then((response) => response.json())
            .then((data) => {
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
          setTmdbMovies([]);
          setHasSearched(false);
        }
      }
    } catch (error) {
      console.error("Error in getMovieRequest:", error);
      setIsLoading(false);
    }
  }

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    tmdbMovies,
    input,
    setInput,
    hasSearched,
    setHasSearched,
    isLoading,
    setIsLoading,
    getMovieRequest,
    filterBySearchTerm,
  };
}

export default useMovieSearch;
