import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { client, clientWithToken } from "@/config/client";
import { movieQuery } from "@/utils/groqQueries";
import { Movie } from "@/typings";
import { useSession } from "next-auth/react";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { movieKeys } from "@/hooks/useMovie";
import SingleMoviePage from "@/components/movie/SingleMoviePage";

// Server-side props to get initial movie data
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { slug } = context.params || {};
    if (!slug) {
      return {
        props: {
          initialMovieData: null,
        },
      };
    }

    const initialMovieData = await client.fetch(movieQuery, {
      movieId: slug,
    });

    return {
      props: {
        initialMovieData: initialMovieData || null,
      },
    };
  } catch (error) {
    console.error("Error fetching movie:", error);
    return {
      props: {
        initialMovieData: null,
      },
    };
  }
};

function SingleMovie({ initialMovieData }: { initialMovieData: Movie | null }) {
  const router = useRouter();
  const { slug } = router.query;
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const queryClient = useQueryClient();

  const slugString =
    typeof slug === "string" ? slug : Array.isArray(slug) ? slug[0] : "";

  // Use TanStack Query to fetch movie data
  const {
    data: movieData,
    isLoading: isQueryLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: movieKeys.detail(slugString),
    queryFn: async () => {
      if (!slugString) return null;
      // Use the same query as in getServerSideProps
      const result = await client.fetch(movieQuery, { movieId: slugString });

      // Add proper null check
      if (!result) throw new Error(`Movie not found: ${slugString}`);

      return result;
    },
    initialData: initialMovieData,
    enabled: !!slugString,
    staleTime: 0, // Set to 0 to always refetch to ensure fresh data
    refetchOnWindowFocus: true, // Refetch on window focus to ensure fresh data
  });

  // Explicitly refetch data when navigating to ensure it's complete
  useEffect(() => {
    if (router.isReady && slugString) {
      // Reset the query cache when navigating to a new movie
      queryClient.removeQueries({ queryKey: movieKeys.detail(slugString) });
      refetch();
    }
  }, [router.isReady, slugString, refetch, queryClient]);

  // Handle page visibility to ensure fresh data
  useEffect(() => {
    if (!router.isReady) return;

    // Fade in content when movie data is loaded
    setContentVisible(false);
    const timer = setTimeout(() => setContentVisible(true), 100);

    return () => clearTimeout(timer);
  }, [slugString, router.isReady]);

  // Monitor route changes
  useEffect(() => {
    function handleStart(url: string) {
      setIsRouteLoading(true);
      setContentVisible(false);
    }

    function handleComplete() {
      setIsRouteLoading(false);
    }

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // Direct rating function that forces immediate UI updates
  async function rateMovie(movieId: string, rating: number) {
    try {
      console.log("Rating movie:", movieId, "with score:", rating);
      if (!session?.user?.name) return;

      // Immediately apply the rating to the UI first, before any backend operations
      const updatedMovieData = structuredClone(movieData); // Use structuredClone for deep copy

      if (!updatedMovieData) {
        console.error("No movie data available for UI update");
        return;
      }

      if (!updatedMovieData.ratings) {
        updatedMovieData.ratings = [];
      }

      // Find this user's rating if it exists
      const userName = session.user.name;
      const personQuery = `*[_type == "person" && name == "${userName}"]`;
      const [existingPerson] = await client.fetch(personQuery);

      if (!existingPerson) {
        console.log("User not found, creating new person record");
        // We'll create the person below, for now just update the UI
      }

      const personId = existingPerson?._id;
      const existingRatingIndex = updatedMovieData.ratings.findIndex(
        (r: any) => {
          // Check if this rating belongs to the current user
          if (r.person && r.person._id === personId) return true;
          if (r.person && r.person._ref === personId) return true;
          return false;
        }
      );

      // Update or add the rating in the UI data
      if (existingRatingIndex >= 0) {
        console.log("Updating existing rating in UI");
        // Direct value override to ensure immediate UI update
        updatedMovieData.ratings[existingRatingIndex].rating = rating;
      } else {
        console.log("Adding new rating in UI");
        // Add a temporary rating object for the UI
        updatedMovieData.ratings.push({
          _key: `temp-${Date.now()}`,
          rating: rating,
          person: {
            _id: personId || "temp-user",
            name: userName,
            image: session.user.image,
          },
        });
      }

      // Directly update the UI cache with forced override
      console.log("Updating UI with new rating:", rating);
      queryClient.setQueryData(movieKeys.detail(slugString), {
        ...updatedMovieData,
        _forceUpdate: Date.now(), // Force React to re-render
      });

      // Force component to re-render by toggling visibility
      setContentVisible(false);
      setTimeout(() => setContentVisible(true), 10);

      // Now handle the actual backend update in the background
      console.log("Updating Sanity in background...");

      let person = existingPerson;
      if (!existingPerson) {
        // Create a new person if not found
        try {
          const imageAsset = await uploadExternalImage(
            session.user.image ?? ""
          );
          const imageAssetId = imageAsset._id;

          const newPerson = {
            _type: "person",
            _id: uuidv4(),
            name: userName,
            image: {
              _type: "image",
              asset: {
                _ref: imageAssetId,
              },
            },
            slug: {
              _type: "slug",
              current: userName?.toLowerCase().replace(/\s+/g, "-"),
            },
          };

          person = await clientWithToken.create(newPerson);
        } catch (error) {
          console.error("Error creating person:", error);
          // Continue with backend update even if this fails
        }
      }

      if (!person || !person._id) {
        console.error("Failed to get or create person record");
        return;
      }

      // Generate a consistent rating key
      const ratingKey = uuidv4();

      // Get the latest movie data from Sanity
      const freshMovieData = await client.fetch(
        `*[_type == "movie" && _id == "${movieId}"][0]`,
        { cacheBuster: Date.now() } // Prevent caching
      );

      if (!freshMovieData) {
        console.error("Movie not found in Sanity");
        return;
      }

      // Check if user already has a rating
      const movieRatings = freshMovieData.ratings || [];
      const sanityRatingIndex = movieRatings.findIndex((r: any) => {
        return r.person && r.person._ref === person._id;
      });

      console.log(
        `Backend update: ${
          sanityRatingIndex >= 0 ? "Updating" : "Adding"
        } rating to ${rating}`
      );

      try {
        if (sanityRatingIndex >= 0) {
          // Update existing rating
          await clientWithToken
            .patch(movieId)
            .set({
              [`ratings[${sanityRatingIndex}].rating`]: rating,
            })
            .commit();
        } else {
          // Add new rating
          await clientWithToken
            .patch(movieId)
            .setIfMissing({ ratings: [] })
            .append("ratings", [
              {
                _key: ratingKey,
                person: { _type: "reference", _ref: person._id },
                rating: rating,
              },
            ])
            .commit();
        }
        console.log("Sanity update successful!");
      } catch (error) {
        console.error("Error updating Sanity:", error);
      }

      // Wait a bit to ensure Sanity has processed the update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch fresh data directly from Sanity, bypassing all caches
      console.log("Fetching fresh data from Sanity");
      const latestMovieData = await client.fetch(movieQuery, {
        movieId: slugString,
        cacheBuster: Date.now(), // Prevent caching
      });

      if (latestMovieData) {
        // Force cache update with the freshest data
        queryClient.setQueryData(movieKeys.detail(slugString), {
          ...latestMovieData,
          _forceCacheUpdate: Date.now(),
        });

        // Invalidate all related caches to ensure everything is updated
        queryClient.invalidateQueries({ queryKey: movieKeys.all });
      }

      // One final UI refresh to ensure consistency
      setContentVisible(false);
      setTimeout(() => setContentVisible(true), 10);
    } catch (error) {
      console.error("Error in rating process:", error);
      alert("There was an error updating your rating. Please try again.");
    }
  }

  // Loading state
  const isLoading =
    !router.isReady || isRouteLoading || (isQueryLoading && !movieData);

  // Use our refactored component
  return (
    <SingleMoviePage
      movieData={movieData}
      contentVisible={contentVisible}
      isLoading={isLoading}
      isRouteLoading={isRouteLoading}
      session={session}
      open={open}
      setOpen={setOpen}
      rateMovie={rateMovie}
      error={error}
      refetch={refetch}
    />
  );
}

export default SingleMovie;
