import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientWithToken } from "@/config/client";
import { movieKeys } from "./useMovie";
import { Movie } from "@/typings";

// Hook to rate a movie
export function useRateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movieId,
      personId,
      rating,
    }: {
      movieId: string;
      personId: string;
      rating: number;
    }) => {
      // First, get the current movie document to check if the user has already rated
      const movie = await clientWithToken.fetch(
        `*[_type == "movie" && _id == $movieId][0]`,
        { movieId }
      );

      // Check if the user has already rated this movie
      const existingRatingIndex = movie.ratings?.findIndex(
        (r: any) => r.person._ref === personId
      );

      if (existingRatingIndex >= 0) {
        // Update existing rating
        return clientWithToken
          .patch(movieId)
          .set({
            [`ratings[${existingRatingIndex}].rating`]: rating,
          })
          .commit();
      } else {
        // Add new rating
        return clientWithToken
          .patch(movieId)
          .setIfMissing({ ratings: [] })
          .append("ratings", [
            {
              _key: `rating-${Date.now()}`,
              person: {
                _type: "reference" as const,
                _ref: personId,
              },
              rating,
            },
          ])
          .commit();
      }
    },
    onSuccess: (result, variables) => {
      // Update the cache directly instead of invalidating
      const movieCache = queryClient.getQueryData<Movie>(
        movieKeys.detail(variables.movieId)
      );

      if (movieCache) {
        // Create a new rating object
        const newRating = {
          person: {
            _type: "reference" as const,
            _ref: variables.personId,
          },
          rating: variables.rating,
        };

        // Check if the rating already exists
        const existingRatingIndex = movieCache.ratings?.findIndex(
          (r) => r.person._ref === variables.personId
        );

        let updatedRatings = [...(movieCache.ratings || [])];

        if (existingRatingIndex >= 0) {
          // Update existing rating
          updatedRatings[existingRatingIndex] = {
            ...updatedRatings[existingRatingIndex],
            rating: variables.rating,
          };
        } else {
          // Add new rating
          updatedRatings.push(newRating);
        }

        // Update the cache
        queryClient.setQueryData(movieKeys.detail(variables.movieId), {
          ...movieCache,
          ratings: updatedRatings,
        });
      } else {
        // If we don't have the movie in cache, invalidate to refetch
        queryClient.invalidateQueries({
          queryKey: movieKeys.detail(variables.movieId),
        });
      }
    },
  });
}

// Hook to delete a rating
export function useDeleteRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movieId,
      personId,
    }: {
      movieId: string;
      personId: string;
    }) => {
      // First, get the current movie document to find the rating
      const movie = await clientWithToken.fetch(
        `*[_type == "movie" && _id == $movieId][0]`,
        { movieId }
      );

      // Find the rating to remove
      const ratingToRemove = movie.ratings?.find(
        (r: any) => r.person._ref === personId
      );

      if (!ratingToRemove) {
        throw new Error("Rating not found");
      }

      // Remove the rating
      return clientWithToken
        .patch(movieId)
        .unset([`ratings[_key=="${ratingToRemove._key}"]`])
        .commit();
    },
    onSuccess: (_, variables) => {
      // Update the cache directly instead of invalidating
      const movieCache = queryClient.getQueryData<Movie>(
        movieKeys.detail(variables.movieId)
      );

      if (movieCache && movieCache.ratings) {
        // Filter out the rating from the person
        const updatedRatings = movieCache.ratings.filter(
          (r) => r.person._ref !== variables.personId
        );

        // Update the cache
        queryClient.setQueryData(movieKeys.detail(variables.movieId), {
          ...movieCache,
          ratings: updatedRatings,
        });
      } else {
        // If we don't have the movie in cache, invalidate to refetch
        queryClient.invalidateQueries({
          queryKey: movieKeys.detail(variables.movieId),
        });
      }
    },
  });
}
