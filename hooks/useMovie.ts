import {
  useQuery,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@/config/client";
import { Movie } from "@/typings";

// Simpler query key factory for movies
export const movieKeys = {
  all: ["movies"] as const,
  lists: () => [...movieKeys.all, "list"] as const,
  list: (filters: string | undefined) =>
    [...movieKeys.lists(), filters] as const,
  details: () => [...movieKeys.all, "detail"] as const,
  detail: (slug: string) => [...movieKeys.details(), slug] as const,
};

// Fetch a single movie by slug or ID
export function useMovie(
  slugOrId: string | string[] | undefined,
  initialData?: Movie
): UseQueryResult<Movie, Error> {
  const queryClient = useQueryClient();
  const slugString = Array.isArray(slugOrId) ? slugOrId[0] : slugOrId;

  return useQuery({
    queryKey: movieKeys.detail(slugString as string),
    queryFn: async () => {
      if (!slugString) throw new Error("No slug or ID provided");

      // Enhanced query with proper image resolution and ALWAYS include both plot and overview fields
      const movieQuery = `*[_type == "movie" && (slug.current == $identifier || _id == $identifier)][0]{
        _id,
        _type,
        title,
        slug,
        "poster": poster.asset->,
        "poster_backdrop": poster_backdrop.asset->,
        overview,
        plot,
        releaseDate,
        genres,
        length,
        _createdAt,
        comments[] {
          person-> {
            name,
            "image": image.asset->,
            _id,
            _key,
          },
          comment,
          _key,
          _createdAt,
          createdAt
        },
        ratings[] {
          _key,
          rating,
          person-> {
            _id,
            name,
            "image": image.asset->
          }
        }
      }`;

      const result = await client.fetch(movieQuery, { identifier: slugString });

      // If no data found, throw error
      if (!result) throw new Error(`Movie not found: ${slugString}`);

      // Ensure plot exists in some form for client-side rendering
      if (
        !result.plot &&
        result.overview &&
        result.overview.children &&
        result.overview.children.length > 0
      ) {
        result.plot = result.overview.children[0].text;
      }

      return result;
    },
    initialData,
    enabled: !!slugString,
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
    refetchOnMount: true, // Always refetch when component mounts to ensure fresh data
  });
}

// Fetch all movies
export function useMovies(filters?: string): UseQueryResult<Movie[], Error> {
  return useQuery({
    queryKey: movieKeys.list(filters),
    queryFn: async () => {
      // Enhanced query with proper image resolution
      const query = filters
        ? `*[_type == "movie" && $genre in genres] | order(_createdAt desc) {
            _id,
            title,
            slug,
            year,
            releaseDate,
            "poster": poster.asset->,
            "poster_backdrop": poster_backdrop.asset->,
            genres,
            _createdAt,
            ratings[] {
              rating,
              _key,
              person-> {
                _id,
                name,
                "image": image.asset->
              }
            },
            "commentCount": count(comments)
          }`
        : `*[_type == "movie"] | order(_createdAt desc) {
            _id,
            title,
            slug,
            year,
            releaseDate,
            "poster": poster.asset->,
            "poster_backdrop": poster_backdrop.asset->,
            genres,
            _createdAt,
            ratings[] {
              rating,
              _key,
              person-> {
                _id,
                name,
                "image": image.asset->
              }
            },
            "commentCount": count(comments)
          }`;

      const result = filters
        ? await client.fetch(query, { genre: filters })
        : await client.fetch(query);

      return result;
    },
    // Shorter stale time to ensure fresher data
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchOnWindowFocus: true, // Refetch when user focuses window to get fresh data
  });
}
