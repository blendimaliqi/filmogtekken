import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client, clientWithToken } from "@/config/client";
import { Comment, Movie } from "@/typings";
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
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: commentKeys.list(movieIdOrSlug),
    enabled: !!movieIdOrSlug,
    queryFn: async () => {
      try {
        // Check if we already have this movie with comments in the cache
        const movieCache = queryClient.getQueryData<Movie>(
          movieKeys.detail(movieIdOrSlug)
        );

        if (
          movieCache &&
          movieCache.comments &&
          movieCache.comments.length > 0
        ) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`Using cached comments for movie: ${movieIdOrSlug}`);
          }

          // Even for cached comments, ensure person data is expanded
          const commentsWithExpandedPerson = await Promise.all(
            movieCache.comments.map(async (comment: any) => {
              // If person is just a reference without name, fetch the person data
              if (
                comment.person &&
                comment.person._ref &&
                !comment.person.name
              ) {
                try {
                  const personQuery = `*[_type == "person" && _id == $personId][0]{
                    _id,
                    name,
                    image
                  }`;
                  const person = await client.fetch(personQuery, {
                    personId: comment.person._ref,
                  });

                  if (person) {
                    return {
                      ...comment,
                      _id: comment._key || comment._id,
                      person: person,
                    };
                  }
                } catch (error) {
                  console.error(
                    "Error fetching person for cached comment:",
                    error
                  );
                }
              }
              return comment;
            })
          );

          return commentsWithExpandedPerson;
        }

        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Fetching comments for movie:", movieIdOrSlug);
        }

        // First try to get the movie by ID with expanded person references
        let movieQuery = `*[_type == "movie" && _id == $identifier][0]{
          comments[] {
            _key,
            comment,
            createdAt,
            _createdAt,
            person-> {
              _id,
              name,
              image
            }
          }
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
            comments[] {
              _key,
              comment,
              createdAt,
              _createdAt,
              person-> {
                _id,
                name,
                image
              }
            }
          }`;
          movie = await client.fetch(movieQuery, { identifier: movieIdOrSlug });
        }

        if (movie && movie.comments && movie.comments.length > 0) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`Found ${movie.comments.length} comments`);
          }

          // For each comment, ensure person data is properly expanded
          const commentsWithPerson = await Promise.all(
            movie.comments.map(async (comment: any) => {
              // If person is still just a reference without name, fetch the person data
              if (
                comment.person &&
                comment.person._ref &&
                !comment.person.name
              ) {
                try {
                  const personQuery = `*[_type == "person" && _id == $personId][0]{
                    _id,
                    name,
                    image
                  }`;
                  const person = await client.fetch(personQuery, {
                    personId: comment.person._ref,
                  });

                  return {
                    ...comment,
                    _id: comment._key, // Use _key as _id for consistency
                    person: person || {
                      name: "Unknown",
                      _id: comment.person._ref,
                    },
                  };
                } catch (error) {
                  console.error("Error fetching person for comment:", error);
                  return {
                    ...comment,
                    _id: comment._key,
                    person: { name: "Unknown", _id: comment.person._ref },
                  };
                }
              }

              // Ensure each comment has an _id property
              return {
                ...comment,
                _id: comment._key || comment._id,
              };
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
          console.log(`Found ${comments.length} standalone comments`);
        }

        return comments;
      } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    cacheTime: 1000 * 60 * 60, // 60 minutes
    refetchOnMount: false,
  });
}

// Hook to add a comment
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movieId,
      personId,
      comment,
    }: {
      movieId: string;
      personId: string;
      comment: string;
    }) => {
      try {
        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          console.log(
            `Adding comment to movie ${movieId} from person ${personId}`
          );
        }

        const commentKey = `comment-${uuidv4()}`;
        const now = new Date().toISOString();

        // Add the comment to the movie
        const result = await clientWithToken
          .patch(movieId)
          .setIfMissing({ comments: [] })
          .append("comments", [
            {
              _key: commentKey,
              person: {
                _type: "reference",
                _ref: personId,
              },
              comment,
              createdAt: now,
            },
          ])
          .commit();

        // Return the result with additional data for the cache update
        return {
          ...result,
          addedComment: {
            _key: commentKey,
            person: {
              _type: "reference",
              _ref: personId,
            },
            comment,
            createdAt: now,
          },
          personId,
        };
      } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      // Update the movie cache directly
      const movieCache = queryClient.getQueryData<Movie>(
        movieKeys.detail(variables.movieId)
      );

      if (movieCache) {
        // Get the person data
        const personCache = queryClient.getQueryData<any>([
          "person",
          variables.personId,
        ]);

        // Create a new comment with person data if available
        const newComment = {
          ...result.addedComment,
          person: personCache || {
            _id: variables.personId,
            _ref: variables.personId,
          },
        };

        // Update the movie cache with the new comment
        queryClient.setQueryData(movieKeys.detail(variables.movieId), {
          ...movieCache,
          comments: [...(movieCache.comments || []), newComment],
        });

        // Also update the comments cache
        const commentsCache = queryClient.getQueryData<any[]>(
          commentKeys.list(variables.movieId)
        );

        if (commentsCache) {
          queryClient.setQueryData(commentKeys.list(variables.movieId), [
            ...commentsCache,
            newComment,
          ]);
        }
      } else {
        // If we don't have the movie in cache, invalidate to refetch
        queryClient.invalidateQueries({
          queryKey: movieKeys.detail(variables.movieId),
        });

        queryClient.invalidateQueries({
          queryKey: commentKeys.list(variables.movieId),
        });
      }
    },
  });
}

// Hook to delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movieId,
      commentKey,
    }: {
      movieId: string;
      commentKey: string;
    }) => {
      try {
        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          console.log(`Deleting comment ${commentKey} from movie ${movieId}`);
        }

        // Delete the comment from the movie
        return await clientWithToken
          .patch(movieId)
          .unset([`comments[_key=="${commentKey}"]`])
          .commit();
      } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Update the movie cache directly
      const movieCache = queryClient.getQueryData<Movie>(
        movieKeys.detail(variables.movieId)
      );

      if (movieCache && movieCache.comments) {
        // Filter out the deleted comment
        const updatedComments = movieCache.comments.filter(
          (c: any) => c._key !== variables.commentKey
        );

        // Update the movie cache
        queryClient.setQueryData(movieKeys.detail(variables.movieId), {
          ...movieCache,
          comments: updatedComments,
        });

        // Also update the comments cache
        const commentsCache = queryClient.getQueryData<any[]>(
          commentKeys.list(variables.movieId)
        );

        if (commentsCache) {
          queryClient.setQueryData(
            commentKeys.list(variables.movieId),
            commentsCache.filter((c) => c._key !== variables.commentKey)
          );
        }
      } else {
        // If we don't have the movie in cache, invalidate to refetch
        queryClient.invalidateQueries({
          queryKey: movieKeys.detail(variables.movieId),
        });

        queryClient.invalidateQueries({
          queryKey: commentKeys.list(variables.movieId),
        });
      }
    },
  });
}
