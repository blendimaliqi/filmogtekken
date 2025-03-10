import { Movie } from "@/typings";

interface MovieWithAverageRating extends Movie {
  averageRating: number;
}

interface MovieWithTotalComments extends Movie {
  totalComments: number;
}

/**
 * Filters movies by highest average rating
 */
export function filterMoviesByHighestAverageRating(
  moviesToFilter: Movie[]
): MovieWithAverageRating[] {
  return moviesToFilter
    .map((movie) => {
      const ratings = movie.ratings || [];
      let sum = 0;
      let count = 0;

      // Calculate average rating
      if (ratings.length > 0) {
        sum = ratings.reduce((acc, curr) => {
          return acc + (curr.rating || 0);
        }, 0);
        count = ratings.length;
      }

      const averageRating = count > 0 ? sum / count : 0;

      return {
        ...movie,
        averageRating,
      };
    })
    .sort((a, b) => b.averageRating - a.averageRating);
}

/**
 * Filters movies by lowest average rating
 */
export function filterMoviesByLowestAverageRating(
  moviesToFilter: Movie[]
): MovieWithAverageRating[] {
  return moviesToFilter
    .map((movie) => {
      const ratings = movie.ratings || [];
      let sum = 0;
      let count = 0;

      // Calculate average rating
      if (ratings.length > 0) {
        sum = ratings.reduce((acc, curr) => {
          return acc + (curr.rating || 0);
        }, 0);
        count = ratings.length;
      }

      const averageRating = count > 0 ? sum / count : 0;

      return {
        ...movie,
        averageRating,
      };
    })
    .sort((a, b) => a.averageRating - b.averageRating);
}

/**
 * Filters movies by newest first (creation date)
 */
export function filterMoviesByNewest(moviesToFilter: Movie[]): Movie[] {
  return [...moviesToFilter].sort((a, b) => {
    const dateA = new Date(a._createdAt).getTime();
    const dateB = new Date(b._createdAt).getTime();
    return dateB - dateA;
  });
}

/**
 * Filters movies by highest number of comments
 */
export function filterMoviesByHighestTotalComments(
  moviesToFilter: Movie[]
): MovieWithTotalComments[] {
  return moviesToFilter
    .map((movie) => ({
      ...movie,
      totalComments: movie.comments?.length || 0,
    }))
    .sort((a, b) => b.totalComments - a.totalComments);
}

/**
 * Apply the selected filter to movies
 */
export function applyMovieFilter(
  moviesToFilter: Movie[],
  activeFilter: string
): Movie[] {
  if (activeFilter === "highest") {
    return filterMoviesByHighestAverageRating(moviesToFilter);
  } else if (activeFilter === "lowest") {
    return filterMoviesByLowestAverageRating(moviesToFilter);
  } else if (activeFilter === "comments") {
    return filterMoviesByHighestTotalComments(moviesToFilter);
  } else if (activeFilter === "newest") {
    return filterMoviesByNewest(moviesToFilter);
  }

  // Default to newest if no valid filter is selected
  return filterMoviesByNewest(moviesToFilter);
}
