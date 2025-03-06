import { useCallback, useState, useEffect } from "react";
import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/config/client";
import { moviesQuery } from "@/utils/groqQueries";
import {
  moviesAtom,
  moviesSortedAtom,
  moviesFilteredAtom,
} from "@/store/atoms";
import type { Movie } from "@/typings";

interface MovieManagementReturn {
  movies: Movie[];
  sortedMovies: Movie[];
  isLoading: boolean;
  handleSortByAverageRating: (filter: string) => void;
  filterMoviesByHighestAverageRating: (movies: Movie[]) => Movie[];
  filterMoviesByLowestAverageRating: (movies: Movie[]) => Movie[];
  filterMoviesByHighestTotalComments: (movies: Movie[]) => Movie[];
}

export function useMovieManagement(
  propMovies?: Movie[]
): MovieManagementReturn {
  const [movies, setMovies] = useAtom(moviesAtom);
  const [sortedMovies, setSortedMovies] = useAtom(moviesSortedAtom);
  const [moviesFiltered, setMoviesFiltered] = useAtom(moviesFilteredAtom);

  // Debug logs
  console.log("useMovieManagement - propMovies:", propMovies?.length);
  console.log("useMovieManagement - movies:", movies?.length);
  console.log("useMovieManagement - sortedMovies:", sortedMovies?.length);
  console.log("useMovieManagement - moviesFiltered:", moviesFiltered);

  // Set movies from propMovies if they exist
  useEffect(() => {
    if (propMovies && propMovies.length > 0) {
      console.log(
        "useMovieManagement - Setting movies from propMovies:",
        propMovies.length
      );
      setMovies(propMovies);
    }
  }, [propMovies, setMovies]);

  const { isLoading } = useQuery({
    queryKey: ["movies"],
    queryFn: () => client.fetch(moviesQuery),
    onSuccess: (data) => {
      console.log("useMovieManagement - query success data:", data?.length);
      if (!propMovies || propMovies.length === 0) {
        setMovies(data);
      }
    },
    enabled: !propMovies || propMovies.length === 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  const filterMoviesByHighestAverageRating = useCallback(
    (moviesToFilter: Movie[]) => {
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
          return { ...movie, averageRating };
        })
        .sort((a: any, b: any) => b.averageRating - a.averageRating);
    },
    []
  );

  const filterMoviesByLowestAverageRating = useCallback(
    (moviesToFilter: Movie[]) => {
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
          return { ...movie, averageRating };
        })
        .sort((a: any, b: any) => a.averageRating - b.averageRating);
    },
    []
  );

  const filterMoviesByHighestTotalComments = useCallback(
    (moviesToFilter: Movie[]) => {
      return moviesToFilter
        .map((movie) => {
          const totalComments = movie.comments ? movie.comments.length : 0;
          return { ...movie, totalComments };
        })
        .sort((a: any, b: any) => b.totalComments - a.totalComments);
    },
    []
  );

  const handleSortByAverageRating = useCallback(
    (filter: string) => {
      setMoviesFiltered(filter);

      if (filter === "highest") {
        setSortedMovies(filterMoviesByHighestAverageRating(movies));
      } else if (filter === "lowest") {
        setSortedMovies(filterMoviesByLowestAverageRating(movies));
      } else if (filter === "comments") {
        setSortedMovies(filterMoviesByHighestTotalComments(movies));
      } else if (filter === "default") {
        setSortedMovies([]);
      }
    },
    [
      movies,
      setSortedMovies,
      setMoviesFiltered,
      filterMoviesByHighestAverageRating,
      filterMoviesByLowestAverageRating,
      filterMoviesByHighestTotalComments,
    ]
  );

  return {
    movies,
    sortedMovies,
    isLoading,
    handleSortByAverageRating,
    filterMoviesByHighestAverageRating,
    filterMoviesByLowestAverageRating,
    filterMoviesByHighestTotalComments,
  };
}
