import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { client } from "@/config/client";
import type { Movie } from "@/typings";
import { movieKeys } from "./useMovie";

export function useMovies(filters?: string): UseQueryResult<Movie[], Error> {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return useQuery({
    queryKey: movieKeys.list(filters),
    queryFn: async () => {
      // Use an optimized query for mobile that returns less data
      if (isMobile) {
        const mobileQuery = filters
          ? `*[_type == "movie" && $genre in genres] | order(releaseDate desc) {
                _id,
                _type,
                _createdAt,
                title,
                slug,
                releaseDate,
                poster,
                poster_backdrop,
                plot,
                genres,
                ratings,
                comments,
                length
              }`
          : `*[_type == "movie"] | order(releaseDate desc) {
                _id,
                _type,
                _createdAt,
                title,
                slug,
                releaseDate,
                poster,
                poster_backdrop,
                plot,
                genres,
                ratings,
                comments,
                length
              }`;

        const result = filters
          ? await client.fetch(mobileQuery, { genre: filters })
          : await client.fetch(mobileQuery);

        // Return the full result instead of processing it
        return result;
      }

      // Regular query for desktop with full data
      // Use a simple query without parameters when no filters are provided
      if (!filters) {
        const result = await client.fetch(
          `*[_type == "movie"] | order(releaseDate desc)`
        );

        return result;
      }

      // Use parameters properly when filters are provided
      const result = await client.fetch(
        `*[_type == "movie" && $genre in genres] | order(releaseDate desc)`,
        { genre: filters }
      );

      return result;
    },
  });
}
