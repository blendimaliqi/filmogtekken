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
export function useComments(
  movieIdOrSlug: string,
  options: { enabled?: boolean } = {}
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: commentKeys.list(movieIdOrSlug),
    enabled: !!movieIdOrSlug && options.enabled !== false,
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

          // Check if comments already have expanded person data
          const allCommentsHavePersonData = movieCache.comments.every(
            (comment: any) =>
              comment.person &&
              comment.person.name &&
              (!comment.person._ref ||
                (comment.person._ref && comment.person.name))
          );

          // If all comments already have person data, return them directly
          if (allCommentsHavePersonData) {
            return movieCache.comments;
          }

          // For comments without person data, fetch it in a single batch instead of one by one
          const personRefs = movieCache.comments
            .filter(
              (comment: any) =>
                comment.person && comment.person._ref && !comment.person.name
            )
            .map((comment: any) => comment.person._ref);

          if (personRefs.length === 0) {
            return movieCache.comments.map((comment: any) => ({
              ...comment,
              _id: comment._key || comment._id,
              person: comment.person || { name: "Ukjent bruker" },
            }));
          }

          try {
            // Fetch all needed persons in a single query
            const personsQuery = `*[_type == "person" && _id in $personIds]{
              _id,
              name,
              image
            }`;

            const persons = await client.fetch(personsQuery, {
              personIds: personRefs,
            });

            // Create a lookup map for quick access
            const personsMap = persons.reduce((acc: any, person: any) => {
              acc[person._id] = person;
              return acc;
            }, {});

            // Map comments with person data
            const commentsWithExpandedPerson = movieCache.comments.map(
              (comment: any) => {
                if (
                  comment.person &&
                  comment.person._ref &&
                  !comment.person.name &&
                  personsMap[comment.person._ref]
                ) {
                  return {
                    ...comment,
                    _id: comment._key || comment._id,
                    person: personsMap[comment.person._ref],
                  };
                }
                return {
                  ...comment,
                  _id: comment._key || comment._id,
                  person: comment.person || { name: "Ukjent bruker" },
                };
              }
            );

            return commentsWithExpandedPerson;
          } catch (error) {
            console.error("Error fetching person data:", error);
            // Return comments with fallback person data
            return movieCache.comments.map((comment: any) => ({
              ...comment,
              _id: comment._key || comment._id,
              person: comment.person || { name: "Ukjent bruker" },
            }));
          }
        }

        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Fetching comments for movie:", movieIdOrSlug);
        }

        // Use a more efficient query that directly expands person references
        const commentsQuery = `*[_type == "movie" && (slug.current == $identifier || _id == $identifier)][0]{
          "comments": comments[] {
            _key,
            comment,
            createdAt,
            _createdAt,
            "person": person-> {
              _id,
              name,
              image
            }
          }
        }`;

        const result = await client.fetch(commentsQuery, {
          identifier: movieIdOrSlug,
        });

        if (!result || !result.comments) {
          return [];
        }

        // Ensure each comment has an _id property and handle missing person data
        const processedComments = result.comments.map((comment: any) => ({
          ...comment,
          _id: comment._key || comment._id,
          person: comment.person || { name: "Ukjent bruker" },
        }));

        // Cache the processed comments
        if (movieCache) {
          queryClient.setQueryData(movieKeys.detail(movieIdOrSlug), {
            ...movieCache,
            comments: processedComments,
          });
        }

        return processedComments;
      } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (increased from 15)
    cacheTime: 1000 * 60 * 120, // 120 minutes (increased from 60)
    refetchOnMount: false,
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
              _type: "comment",
              person: {
                _type: "reference",
                _ref: personId,
              },
              comment,
              createdAt: now,
            },
          ])
          .commit({});

        // Return the result with additional data for the cache update
        return {
          ...result,
          addedComment: {
            _key: commentKey,
            _type: "comment",
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
        // Get the person data from the cache
        const personQuery = `*[_type == "person" && _id == $personId][0]{
          _id,
          name,
          image
        }`;

        // Fetch the person data immediately
        client
          .fetch(personQuery, { personId: variables.personId })
          .then((personData) => {
            // Create a new comment with person data
            const newComment = {
              ...result.addedComment,
              person: personData || { name: "Ukjent bruker" },
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
          });
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
          .commit({});
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
