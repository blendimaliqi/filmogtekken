import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Image from "next/image";
import Head from "next/head";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "jotai";
import { SessionProvider, useSession } from "next-auth/react";
import Nav from "@/components/Nav";
import MiniNav from "@/components/MiniNav";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useRef } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ColorRing } from "react-loader-spinner";
import { client, clientWithToken, urlFor } from "@/config/client";
import { uploadExternalImage } from "@/utils/helperFunctions";
import { useCurrentPerson, useUpdateProfileImage } from "@/hooks";

// Create a client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 15, // 15 minutes (increased from 5)
      cacheTime: 1000 * 60 * 60, // 60 minutes (increased from 30)
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: false, // Don't refetch when component mounts if data exists
      // Reduce excessive logging in production
      onError: (error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("Global query error:", error);
        }
      },
    },
    mutations: {
      onError: (error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("Global mutation error:", error);
        }
      },
    },
  },
});

// Component to handle profile image updates
function ProfileImageUpdater() {
  const { data: session } = useSession();
  const { data: personData, refetch: refetchPerson } = useCurrentPerson();
  const updateProfileImage = useUpdateProfileImage();
  const [hasAttemptedUpdate, setHasAttemptedUpdate] = useState(false);

  // Completely disable profile image updates for now to avoid further issues
  const isProfileUpdateEnabled = false;

  const updateProfileImageIfChanged = useCallback(
    async (person: any, currentImageUrl: string) => {
      // Disable updates if the feature flag is off
      if (!isProfileUpdateEnabled) {
        console.log("Profile image updates are disabled");
        return;
      }

      if (
        !person ||
        !person._id ||
        !currentImageUrl ||
        !person.image ||
        !person.image.asset
      )
        return;

      try {
        const storedImageUrl = urlFor(person.image).url();

        // Extract just the base URL without query parameters for comparison
        const storedImageBase = storedImageUrl.split("?")[0];
        const currentImageBase = currentImageUrl.split("?")[0];

        // If the Discord image URL has changed, update the person's image in Sanity
        if (storedImageBase !== currentImageBase) {
          console.log("Updating profile image globally...");

          // Check if we already have this image cached
          const imageUrlKey = `image_upload_${currentImageBase}`;
          const hasRecentUpdate = localStorage.getItem(
            `profile_update_${person._id}`
          );
          const currentTime = Date.now();

          // Only proceed if we haven't updated recently (within 24 hours)
          if (
            !hasRecentUpdate ||
            currentTime - parseInt(hasRecentUpdate) > 24 * 60 * 60 * 1000
          ) {
            updateProfileImage.mutate(
              {
                personId: person._id,
                imageUrl: currentImageUrl,
              },
              {
                onSuccess: () => {
                  console.log("Profile image updated successfully globally");
                  localStorage.setItem(
                    `profile_update_${person._id}`,
                    Date.now().toString()
                  );
                  // Don't refetch immediately to avoid potential loops
                  setTimeout(() => refetchPerson(), 1000);
                },
                onError: (error) => {
                  console.error(
                    "Error updating profile image globally:",
                    error
                  );
                  // Mark as attempted even on error to prevent repeated attempts
                  setHasAttemptedUpdate(true);

                  // Store the error in localStorage to prevent future attempts
                  localStorage.setItem(
                    `profile_update_error_${person._id}`,
                    Date.now().toString()
                  );
                },
              }
            );
          } else {
            console.log("Skipping profile image update - updated recently");
          }
        }
      } catch (error) {
        console.error("Error updating profile image globally:", error);
        // Mark as attempted on error
        setHasAttemptedUpdate(true);
      }
    },
    [
      refetchPerson,
      updateProfileImage,
      setHasAttemptedUpdate,
      isProfileUpdateEnabled,
    ]
  );

  useEffect(() => {
    // Skip updates if the feature is disabled
    if (!isProfileUpdateEnabled) return;

    // Only attempt the update once per session to prevent infinite loops
    if (hasAttemptedUpdate) return;

    if (
      session &&
      session.user &&
      personData &&
      personData._id &&
      session.user.image
    ) {
      const lastUpdateTime = localStorage.getItem(
        `profile_update_${personData._id}`
      );

      // Check if we've had errors updating this profile recently
      const lastErrorTime = localStorage.getItem(
        `profile_update_error_${personData._id}`
      );

      const currentTime = Date.now();

      // Skip update if we've had an error in the last 24 hours
      if (
        lastErrorTime &&
        currentTime - parseInt(lastErrorTime) < 24 * 60 * 60 * 1000
      ) {
        console.log("Skipping profile image update - error occurred recently");
        setHasAttemptedUpdate(true);
        return;
      }

      // Only update if it's been more than 24 hours since the last update
      if (
        !lastUpdateTime ||
        currentTime - parseInt(lastUpdateTime) > 24 * 60 * 60 * 1000
      ) {
        updateProfileImageIfChanged(personData, session.user.image);
        setHasAttemptedUpdate(true);
      } else {
        console.log("Skipping profile image update check - checked recently");
        setHasAttemptedUpdate(true);
      }
    }
  }, [
    session,
    personData,
    updateProfileImageIfChanged,
    hasAttemptedUpdate,
    isProfileUpdateEnabled,
  ]);

  return null; // This component doesn't render anything
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: {
  Component: any;
  pageProps: any;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const router = useRouter();
  const queryClientRef = useRef<QueryClient>();

  // Initialize QueryClient if it doesn't exist yet
  if (!queryClientRef.current) {
    queryClientRef.current = queryClient;
  }

  // Handle route change start
  const handleStart = (url: string) => {
    // Don't show loading indicator for same-page anchor links
    if (
      url.includes("#") &&
      url.split("#")[0] === router.asPath.split("#")[0]
    ) {
      return;
    }

    // Check if we're navigating back to the homepage
    const isNavigatingToHome = url === "/" || url === "";

    // Don't show loading for quick navigations (using cached data)
    const hasMoviesCache = queryClient.getQueryData([
      "movies",
      "list",
      { filters: "all" },
    ]);

    const targetSlug = url.split("/").pop();
    const hasTargetMovieCache =
      targetSlug && queryClient.getQueryData(["movies", "detail", targetSlug]);

    // Only show loading for uncached routes or initial load
    // Skip loading indicator when navigating back to home if we have cache
    if (
      (!isNavigatingToHome || !hasMoviesCache) &&
      (!hasMoviesCache || (targetSlug && !hasTargetMovieCache))
    ) {
      setIsLoading(true);
      setLoadingText("Loading...");
    }
  };

  // Handle route change complete
  const handleComplete = () => {
    setIsLoading(false);
  };

  // Handle route change error
  const handleError = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleError);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleError);
    };
  }, [router.events, handleStart]);

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <Provider>
          <ProfileImageUpdater />
          {isLoading && (
            <div className="fixed inset-0 flex justify-center items-center bg-black/90 z-50 animate-fadeIn">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500"></div>
              </div>
            </div>
          )}
          <Head>
            <title>Film med Gutta</title>
          </Head>
          <style jsx global>{`
            body {
              overflow-x: hidden;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes fadeOut {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }

            .animate-fadeIn {
              animation: fadeIn 0.3s ease-in-out forwards;
            }

            .animate-fadeOut {
              animation: fadeOut 0.3s ease-in-out forwards;
            }

            .page-transition {
              transition: opacity 0.3s ease-in-out;
            }
          `}</style>

          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              zIndex: "20",
              width: "100%",
            }}
          >
            <Nav />
          </div>
          <div className="flex flex-col justify-center items-center">
            <MiniNav />
          </div>
          <div
            className={`pt-0 md:pt-0 page-transition ${
              !isLoading ? "opacity-100" : "opacity-0"
            }`}
          >
            <Component {...pageProps} />
          </div>

          <ToastContainer />
          <ReactQueryDevtools initialIsOpen={false} />
        </Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
