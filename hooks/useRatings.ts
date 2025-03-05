import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientWithToken } from "@/config/client";
import { movieKeys } from "./useMovie";

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
                _type: "reference",
                _ref: personId,
              },
              rating,
            },
          ])
          .commit();
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch the movie data
      queryClient.invalidateQueries({
        queryKey: movieKeys.detail(variables.movieId),
      });
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
      // Invalidate and refetch the movie data
      queryClient.invalidateQueries({
        queryKey: movieKeys.detail(variables.movieId),
      });
    },
  });
}
