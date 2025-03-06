import {
  useQuery,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@/config/client";
import { Movie } from "@/typings";

// Query key factory for movies
export const movieKeys = {
  all: ["movies"] as const,
  lists: () => [...movieKeys.all, "list"] as const,
  list: (filters: string | undefined) =>
    [...movieKeys.lists(), { filters: filters || "all" }] as const,
  details: () => [...movieKeys.all, "detail"] as const,
  detail: (slug: string) => [...movieKeys.details(), slug] as const,
};

// Fetch a single movie by slug or ID
export function useMovie(
  slugOrId: string | string[] | undefined,
  initialData?: Movie
): UseQueryResult<Movie, Error> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: movieKeys.detail(slugOrId as string),
    queryFn: async () => {
      if (!slugOrId) throw new Error("No slug or ID provided");

      try {
        // Check if we already have this movie in the cache from the list query
        const allMoviesCache = queryClient.getQueryData<Movie[]>(
          movieKeys.list(undefined)
        );

        if (allMoviesCache) {
          const cachedMovie = allMoviesCache.find(
            (m) => m.slug?.current === slugOrId || m._id === slugOrId
          );

          // If we have a basic version of the movie in cache, we can use it while fetching details
          if (cachedMovie && !initialData) {
            // Use as initialData if not already provided
            initialData = cachedMovie;
          }
        }

        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Fetching movie with slug or ID:", slugOrId);
        }

        // Try to get by slug or ID
        const movieQuery = `*[_type == "movie" && (slug.current == $identifier || _id == $identifier)][0]{
          ...,
          comments[] {
            person-> {
              name,
              image,
              _id,
              _key,
            },
            comment,
            _key,
            _createdAt,
            createdAt
          },
          ratings[] {
            person-> {
              name,
              image,
              _id,
            },
            rating
          }
        }`;

        const result = await client.fetch(movieQuery, { identifier: slugOrId });

        if (!result) {
          console.error("No movie found with slug or ID:", slugOrId);
          throw new Error("Movie not found");
        }

        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          // Log the raw data to help debug
          console.log("Raw movie data:", JSON.stringify(result, null, 2));

          // Check if the movie has comments
          if (result.comments && result.comments.length > 0) {
            console.log(`Movie has ${result.comments.length} comments`);
          }

          // Check if the movie has ratings
          if (result.ratings && result.ratings.length > 0) {
            console.log(`Movie has ${result.ratings.length} ratings`);
          }
        }

        return result;
      } catch (error) {
        console.error("Error fetching movie:", error);
        throw error;
      }
    },
    enabled: !!slugOrId,
    initialData,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnMount: false, // Don't refetch when component mounts if data exists
  });
}

// Fetch all movies
export function useMovies(filters?: string): UseQueryResult<Movie[], Error> {
  return useQuery({
    queryKey: movieKeys.list(filters),
    queryFn: async () => {
      try {
        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Fetching movies with filters:", filters || "none");
        }

        // Use a simple query without parameters when no filters are provided
        if (!filters) {
          const result = await client.fetch(
            `*[_type == "movie"] | order(releaseDate desc)`
          );

          if (process.env.NODE_ENV !== "production") {
            console.log(`Fetched ${result.length} movies`);
          }

          return result;
        }

        // Use parameters properly when filters are provided
        const result = await client.fetch(
          `*[_type == "movie" && $genre in genres] | order(releaseDate desc)`,
          { genre: filters }
        );

        if (process.env.NODE_ENV !== "production") {
          console.log(`Fetched ${result.length} movies with genre ${filters}`);
        }

        return result;
      } catch (error) {
        console.error("Error fetching movies:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes (increased from 5)
    cacheTime: 1000 * 60 * 60, // 60 minutes (increased from 30)
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error("React Query error in useMovies:", error);
    },
  });
}
