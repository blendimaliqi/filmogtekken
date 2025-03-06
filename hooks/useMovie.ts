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
        // Check if we have the device type in localStorage
        const isMobile =
          typeof window !== "undefined" && window.innerWidth < 768;

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

        // Try to get by slug or ID with optimized query for mobile
        const movieQuery = isMobile
          ? `*[_type == "movie" && (slug.current == $identifier || _id == $identifier)][0]{
              ...,
              overview,
              plot,
              "ratings": ratings[] {
                _key,
                rating,
                "person": person._ref
              }
            }`
          : `*[_type == "movie" && (slug.current == $identifier || _id == $identifier)][0]{
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

        // For mobile, process the comments to reduce memory footprint and ensure plot field is available
        if (isMobile) {
          // Ensure we only keep essential data for ratings
          if (result.ratings) {
            result.ratings = result.ratings.map((rating: any) => ({
              _key: rating._key,
              rating: rating.rating,
              person: rating.person ? { _ref: rating.person } : null,
            }));
          }

          // Always ensure plot field is available regardless of overview format
          if (!result.plot || result.plot === "") {
            if (result.overview) {
              try {
                // Handle different types of overview field (string or BlockContent)
                if (typeof result.overview === "string") {
                  result.plot = result.overview;
                } else if (Array.isArray(result.overview)) {
                  // Handle array format (sometimes used for rich text)
                  result.plot = result.overview
                    .map((block: any) => {
                      if (typeof block === "string") return block;
                      if (block && block.children) {
                        return block.children
                          .map((child: any) => child?.text || "")
                          .join("");
                      }
                      return block?.text || "";
                    })
                    .join("\n")
                    .trim();
                } else if (
                  result.overview &&
                  result.overview._type &&
                  result.overview.children &&
                  Array.isArray(result.overview.children)
                ) {
                  // Try to extract text from blockContent if possible
                  const blocks = result.overview.children || [];
                  result.plot = blocks
                    .map((block: any) => block?.text || "")
                    .join("\n")
                    .trim();
                } else {
                  // Fallback for other object structures - safely stringify
                  try {
                    if (typeof result.overview === "object") {
                      // Try to find any text property in the overview object
                      const overviewObj = result.overview;
                      if (overviewObj.text) {
                        result.plot = overviewObj.text;
                      } else if (overviewObj.content) {
                        if (typeof overviewObj.content === "string") {
                          result.plot = overviewObj.content;
                        } else if (Array.isArray(overviewObj.content)) {
                          result.plot = overviewObj.content
                            .map((item: any) =>
                              typeof item === "string" ? item : item?.text || ""
                            )
                            .join("\n");
                        }
                      } else {
                        result.plot = "No description available";
                      }
                    } else {
                      result.plot = "No description available";
                    }
                  } catch (e) {
                    console.error("Error processing overview object:", e);
                    result.plot = "No description available";
                  }
                }
              } catch (e) {
                console.error("Error processing overview:", e);
                result.plot = "No description available";
              }
            } else {
              // No overview available
              result.plot = "No description available";
            }
          }
        } else {
          // For desktop, ensure plot field is available from overview if needed
          if (!result.plot && result.overview) {
            // Handle different types of overview field (string or BlockContent)
            if (typeof result.overview === "string") {
              result.plot = result.overview;
            } else if (result.overview._type === "blockContent") {
              // Try to extract text from blockContent if possible
              try {
                const blocks = result.overview.children || [];
                result.plot = blocks
                  .map((block: any) => block.text || "")
                  .join("\n");
              } catch (e) {
                console.error("Error extracting text from blockContent:", e);
                result.plot = "No description available";
              }
            } else {
              // Fallback
              result.plot = "No description available";
            }
          }
        }

        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          // Log the raw data to help debug, but only in dev mode
          console.log("Raw movie data:", result);

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
    staleTime: 1000 * 60 * 30, // 30 minutes (increased from 15)
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnWindowFocus: false, // Don't refetch on window focus
    cacheTime: 1000 * 60 * 60, // 60 minutes
  });
}

// Fetch all movies
export function useMovies(filters?: string): UseQueryResult<Movie[], Error> {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return useQuery({
    queryKey: movieKeys.list(filters),
    queryFn: async () => {
      try {
        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Fetching movies with filters:", filters || "none");
        }

        // Use an optimized query for mobile that returns less data
        if (isMobile) {
          const mobileQuery = filters
            ? `*[_type == "movie" && $genre in genres] | order(releaseDate desc) {
                _id,
                title,
                slug,
                year,
                releaseDate,
                poster,
                genres,
                "ratings": ratings[].rating,
                "commentCount": count(comments)
              }`
            : `*[_type == "movie"] | order(releaseDate desc) {
                _id,
                title,
                slug,
                year,
                releaseDate,
                poster,
                genres,
                "ratings": ratings[].rating,
                "commentCount": count(comments)
              }`;

          const result = filters
            ? await client.fetch(mobileQuery, { genre: filters })
            : await client.fetch(mobileQuery);

          if (process.env.NODE_ENV !== "production") {
            console.log(
              `Fetched ${result.length} movies for mobile with ${
                filters ? `genre ${filters}` : "no filters"
              }`
            );
          }

          // Process the results to match the expected interface but with less data
          return result.map((movie: any) => ({
            ...movie,
            comments: [],
            ratings: movie.ratings
              ? movie.ratings.map((rating: number) => ({ rating }))
              : [],
          }));
        }

        // Regular query for desktop with full data
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
    staleTime: 1000 * 60 * 30, // 30 minutes (increased from 15)
    cacheTime: 1000 * 60 * 60, // 60 minutes
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error("React Query error in useMovies:", error);
    },
  });
}
