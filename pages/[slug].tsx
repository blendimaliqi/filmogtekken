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
    staleTime: 1000 * 30, // 30 seconds stale time to balance performance and freshness
  });

  // Explicitly refetch data when navigating to ensure it's complete
  useEffect(() => {
    if (router.isReady && slugString) {
      refetch();
    }
  }, [router.isReady, slugString, refetch]);

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

  // Rate movie function - using regular function declaration
  async function rateMovie(movieId: string, rating: number) {
    try {
      console.log("Rating movie:", movieId, "with score:", rating);
      if (!session?.user?.name) return;

      const userName = session.user.name;
      const personQuery = `*[_type == "person" && name == "${userName}"]`;
      const [existingPerson] = await client.fetch(personQuery);

      let person: any;

      if (!existingPerson) {
        // Create a new person if not found
        const imageAsset = await uploadExternalImage(session.user.image ?? "");
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
      } else {
        person = existingPerson;
      }

      // Create a new rating object
      const newRating = {
        _key: uuidv4(),
        person: { _type: "reference", _ref: person._id },
        rating: rating,
        _createdAt: new Date().toISOString(),
      };

      // Make a local copy of movie data to update UI immediately
      const updatedMovieData = { ...movieData };

      // Check if ratings array exists
      if (!updatedMovieData.ratings) {
        updatedMovieData.ratings = [];
      }

      // Check if there's an existing rating by this user
      const existingIndex = updatedMovieData.ratings.findIndex(
        (r: any) =>
          r.person._ref === person._id ||
          (r.person._id && r.person._id === person._id)
      );

      if (existingIndex > -1) {
        // Update existing rating
        updatedMovieData.ratings[existingIndex].rating = rating;
      } else {
        // Add new rating
        updatedMovieData.ratings.push({
          ...newRating,
          person: {
            ...person,
            _ref: person._id,
          },
        });
      }

      // Update the cache immediately to reflect changes in UI
      queryClient.setQueryData(movieKeys.detail(slugString), updatedMovieData);

      // Update the backend
      const movieQueryWithRating = `*[_type == "movie" && _id == "${movieId}" && defined(ratings)]`;
      const [movieWithRating] = await client.fetch(movieQueryWithRating);

      if (movieWithRating) {
        const existingRatingIndex = movieWithRating.ratings.findIndex(
          (rating: any) => rating.person._ref === person._id
        );

        if (existingRatingIndex > -1) {
          const updatedRatings = [...movieWithRating.ratings];
          updatedRatings[existingRatingIndex].rating = rating;
          updatedRatings[existingRatingIndex]._createdAt =
            new Date().toISOString();
          movieWithRating.ratings = updatedRatings;
        } else {
          movieWithRating.ratings.push(newRating);
        }

        await clientWithToken
          .patch(movieId)
          .set({ ratings: movieWithRating.ratings })
          .commit({});
      } else {
        await clientWithToken
          .patch(movieId)
          .setIfMissing({ ratings: [] })
          .append("ratings", [newRating])
          .commit({});
      }

      // Force a refetch to ensure we have the most up-to-date data
      setTimeout(() => {
        refetch();

        // Also invalidate other queries that might contain this movie
        queryClient.invalidateQueries({ queryKey: movieKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: movieKeys.list(undefined),
        });
      }, 500);
    } catch (error) {
      console.error("Error updating movie rating:", error);
      // Force a refetch in case of error to ensure UI is consistent
      refetch();
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
