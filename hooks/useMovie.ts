import {
  useQuery,
  UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@/config/client";
import { Movie, BlockContent } from "@/typings";

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
              _id,
              _type,
              title,
              slug,
              poster,
              poster_backdrop,
              overview,
              plot,
              releaseDate,
              genres,
              length,
              _createdAt,
              ratings[] {
                _key,
                rating,
                _createdAt,
                person->{
                  _id,
                  name,
                  image
                }
              }
            }`
          : `*[_type == "movie" && (slug.current == $identifier || _id == $identifier)][0]{
              ...,
              _createdAt,
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
                _key,
                rating,
                _createdAt,
                person-> {
                  _id,
                  name,
                  image
                }
              }
            }`;

        const result = await client.fetch(movieQuery, { identifier: slugOrId });

        if (!result) {
          console.error("No movie found with slug or ID:", slugOrId);
          throw new Error("Movie not found");
        }

        // Create a safe result object with default values for required fields
        const safeResult = {
          _type: "movie",
          _id: result._id || "",
          _rev: result._rev || "",
          _createdAt: result._createdAt || "",
          _updatedAt: result._updatedAt || "",
          title: result.title || "Untitled Movie",
          comments: result.comments || [],
          ratings: result.ratings || [],
          length: result.length || 0,
          plot: result.plot || "",
          slug: result.slug || { _type: "slug", current: "" },
          overview: result.overview || null,
          releaseDate: result.releaseDate || "",
          poster: result.poster || null,
          genres: result.genres || [],
          poster_backdrop: result.poster_backdrop || null,
          externalId: result.externalId || 0,
          popularity: result.popularity || 0,
          ...result,
        };

        // For mobile, process the comments to reduce memory footprint and ensure plot field is available
        if (isMobile) {
          // Ensure we only keep essential data for ratings
          if (safeResult.ratings) {
            safeResult.ratings = safeResult.ratings.map((rating: any) => ({
              _key: rating._key || "",
              rating: rating.rating || 0,
              person: rating.person ? { _ref: rating.person } : null,
            }));
          }

          // Always ensure plot field is available regardless of overview format
          if (!safeResult.plot || safeResult.plot === "") {
            if (safeResult.overview) {
              try {
                // Handle different types of overview field (string or BlockContent)
                if (typeof safeResult.overview === "string") {
                  safeResult.plot = safeResult.overview;
                } else if (Array.isArray(safeResult.overview)) {
                  // Handle array format (sometimes used for rich text)
                  safeResult.plot = safeResult.overview
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
                  safeResult.overview &&
                  safeResult.overview._type &&
                  safeResult.overview.children &&
                  Array.isArray(safeResult.overview.children)
                ) {
                  // Try to extract text from blockContent if possible
                  const blocks = safeResult.overview.children || [];
                  safeResult.plot = blocks
                    .map((block: any) => block?.text || "")
                    .join("\n")
                    .trim();
                } else {
                  // Fallback for other object structures - safely stringify
                  try {
                    if (typeof safeResult.overview === "object") {
                      // Try to find any text property in the overview object
                      const overviewObj = safeResult.overview;
                      if (overviewObj.text) {
                        safeResult.plot = overviewObj.text;
                      } else if (overviewObj.content) {
                        if (typeof overviewObj.content === "string") {
                          safeResult.plot = overviewObj.content;
                        } else if (Array.isArray(overviewObj.content)) {
                          safeResult.plot = overviewObj.content
                            .map((item: any) =>
                              typeof item === "string" ? item : item?.text || ""
                            )
                            .join("\n");
                        }
                      } else {
                        safeResult.plot = "No description available";
                      }
                    } else {
                      safeResult.plot = "No description available";
                    }
                  } catch (e) {
                    console.error("Error processing overview object:", e);
                    safeResult.plot = "No description available";
                  }
                }
              } catch (e) {
                console.error("Error processing overview:", e);
                safeResult.plot = "No description available";
              }
            } else {
              // No overview available
              safeResult.plot = "No description available";
            }
          }
        } else {
          // For desktop, ensure plot field is available from overview if needed
          if (!safeResult.plot && safeResult.overview) {
            // Handle different types of overview field (string or BlockContent)
            if (typeof safeResult.overview === "string") {
              safeResult.plot = safeResult.overview;
            } else if (safeResult.overview._type === "blockContent") {
              // Try to extract text from blockContent if possible
              try {
                const blocks = safeResult.overview.children || [];
                safeResult.plot = blocks
                  .map((block: any) => block?.text || "")
                  .join("\n");
              } catch (e) {
                console.error("Error extracting text from blockContent:", e);
                safeResult.plot = "No description available";
              }
            } else {
              // Fallback
              safeResult.plot = "No description available";
            }
          }
        }

        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          // Log the raw data to help debug, but only in dev mode
          console.log("Raw movie data:", safeResult);

          // Check if the movie has comments
          if (safeResult.comments && safeResult.comments.length > 0) {
            console.log(`Movie has ${safeResult.comments.length} comments`);
          }

          // Check if the movie has ratings
          if (safeResult.ratings && safeResult.ratings.length > 0) {
            console.log(`Movie has ${safeResult.ratings.length} ratings`);
          }
        }

        return safeResult;
      } catch (error) {
        console.error("Error fetching movie:", error);

        // Return a minimal valid Movie object in case of error
        const fallbackMovie = {
          _type: "movie",
          _id: typeof slugOrId === "string" ? slugOrId : "",
          _rev: "",
          _createdAt: "",
          _updatedAt: "",
          title: "Error loading movie",
          comments: [],
          ratings: [],
          length: 0,
          plot: "There was an error loading this movie. Please try again later.",
          slug: {
            _type: "slug",
            current: typeof slugOrId === "string" ? slugOrId : "",
          },
          overview: { _type: "block", children: [] } as BlockContent,
          releaseDate: "",
          poster: { _type: "image", asset: { _type: "reference", _ref: "" } },
          genres: [],
          poster_backdrop: {
            _type: "image",
            asset: { _type: "reference", _ref: "" },
          },
          externalId: 0,
          popularity: 0,
        } as Movie;

        return fallbackMovie;
      }
    },
    enabled: !!slugOrId,
    initialData,
    staleTime: 1000 * 60 * 30, // 30 minutes (increased from 15)
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnWindowFocus: false, // Don't refetch on window focus
    cacheTime: 1000 * 60 * 60, // 60 minutes
    retry: 1, // Only retry once to avoid excessive requests on error
    onError: (error) => {
      console.error("React Query error in useMovie:", error);
    },
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
    staleTime: 1000 * 60 * 60, // 60 minutes (increased from 30)
    cacheTime: 1000 * 60 * 120, // 2 hours (increased from 60 minutes)
    retry: 1, // Reduce number of retries
    retryDelay: 3000, // Increase retry delay to 3 seconds
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    onError: (error) => {
      console.error("React Query error in useMovies:", error);
    },
  });
}
