import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client, clientWithToken } from "@/config/client";
import { Comment } from "@/typings";
import { movieKeys } from "./useMovie";
import { uuidv4 } from "@/utils/helperFunctions";

// Query key factory for comments
export const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (movieId: string) => [...commentKeys.lists(), movieId] as const,
};

// Hook to get comments for a movie
export function useComments(movieIdOrSlug: string) {
  return useQuery({
    queryKey: commentKeys.list(movieIdOrSlug),
    enabled: !!movieIdOrSlug,
    queryFn: async () => {
      try {
        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Fetching comments for movie:", movieIdOrSlug);
        }

        // First try to get the movie by ID
        let movieQuery = `*[_type == "movie" && _id == $identifier][0]{
          comments
        }`;

        let movie = await client.fetch(movieQuery, {
          identifier: movieIdOrSlug,
        });

        // If not found by ID, try by slug
        if (!movie) {
          if (process.env.NODE_ENV !== "production") {
            console.log("No movie found with ID, trying slug:", movieIdOrSlug);
          }

          movieQuery = `*[_type == "movie" && slug.current == $identifier][0]{
            comments
          }`;
          movie = await client.fetch(movieQuery, { identifier: movieIdOrSlug });
        }

        if (movie && movie.comments && movie.comments.length > 0) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`Found ${movie.comments.length} comments`);
          }

          // For each comment, fetch the person data if needed
          const commentsWithPerson = await Promise.all(
            movie.comments.map(async (comment: any) => {
              if (
                comment.person &&
                comment.person._ref &&
                !comment.person.name
              ) {
                try {
                  const personQuery = `*[_type == "person" && _id == $personId][0]`;
                  const person = await client.fetch(personQuery, {
                    personId: comment.person._ref,
                  });

                  return {
                    ...comment,
                    _id: comment._key, // Use _key as _id for consistency
                    person: person || { name: "Unknown" },
                  };
                } catch (error) {
                  console.error("Error fetching person for comment:", error);
                  return {
                    ...comment,
                    _id: comment._key,
                    person: { name: "Unknown" },
                  };
                }
              }
              return comment;
            })
          );

          if (process.env.NODE_ENV !== "production") {
            console.log("Processed comments:", commentsWithPerson);
          }

          return commentsWithPerson;
        }

        // If no comments found in the movie, try to get regular comments
        const commentsQuery = `*[_type == "comment" && movie._ref == $movieId]{
          ...,
          person->{
            name,
            image
          }
        } | order(_createdAt desc)`;

        const comments = await client.fetch(commentsQuery, {
          movieId: movieIdOrSlug,
        });

        if (process.env.NODE_ENV !== "production") {
          console.log(
            `Fetched ${comments.length} regular comments for movie ${movieIdOrSlug}`
          );
        }

        return comments;
      } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Increase to 5 minutes to match other queries
  });
}

// Hook to add a comment
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      comment,
      movieId,
      personId,
    }: {
      comment: string;
      movieId: string;
      personId: string;
    }) => {
      try {
        if (process.env.NODE_ENV !== "production") {
          console.log("Adding comment to movie:", movieId);
        }

        // Add as comment in the comments array
        if (process.env.NODE_ENV !== "production") {
          console.log("Adding as comment");
        }

        const newComment = {
          _key: `comment-${uuidv4()}`,
          _type: "comment",
          comment,
          person: {
            _type: "reference",
            _ref: personId,
          },
          createdAt: new Date().toISOString(),
        };

        if (process.env.NODE_ENV !== "production") {
          console.log("New comment:", newComment);
        }

        return clientWithToken
          .patch(movieId)
          .setIfMissing({ comments: [] })
          .append("comments", [newComment])
          .commit();
      } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch comments for this movie
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.movieId),
      });

      // Also invalidate the movie query to update comment count
      queryClient.invalidateQueries({
        queryKey: movieKeys.detail(variables.movieId),
      });
    },
  });
}

// Hook to delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      movieId,
    }: {
      commentId: string;
      movieId: string;
    }) => {
      try {
        console.log("Deleting comment:", commentId);

        // This is a comment, we need to remove it from the movie
        console.log("Deleting comment from movie:", movieId);

        // First, get the movie to find the comment
        const movie = await clientWithToken.fetch(
          `*[_type == "movie" && _id == $movieId][0]`,
          { movieId }
        );

        if (!movie) {
          throw new Error("Movie not found");
        }

        if (!movie.comments || movie.comments.length === 0) {
          console.warn("No comments found in movie");
          return null;
        }

        console.log("Movie comments:", movie.comments);
        console.log("Looking for comment with key:", commentId);

        // Find the comment in the comments array
        const commentToDelete = movie.comments.find(
          (c: any) => c._key === commentId
        );

        if (!commentToDelete) {
          console.warn("Comment not found in comments");
          return null;
        }

        console.log("Found comment to delete:", commentToDelete);

        // Remove the comment from the comments array
        return clientWithToken
          .patch(movieId)
          .unset([`comments[_key=="${commentId}"]`])
          .commit();
      } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch comments for this movie
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.movieId),
      });

      // Also invalidate the movie query to update comment count
      queryClient.invalidateQueries({
        queryKey: movieKeys.detail(variables.movieId),
      });
    },
  });
}
