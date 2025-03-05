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
import { useEffect, useState, useCallback } from "react";
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
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.error("Global query error:", error);
      },
    },
    mutations: {
      onError: (error) => {
        console.error("Global mutation error:", error);
      },
    },
  },
});

// Component to handle profile image updates
function ProfileImageUpdater() {
  const { data: session } = useSession();
  const { data: personData, refetch: refetchPerson } = useCurrentPerson();
  const updateProfileImage = useUpdateProfileImage();

  const updateProfileImageIfChanged = useCallback(
    async (person: any, currentImageUrl: string) => {
      if (!person || !person.image || !person.image.asset) return;

      try {
        const storedImageUrl = urlFor(person.image).url();

        // Extract just the base URL without query parameters for comparison
        const storedImageBase = storedImageUrl.split("?")[0];
        const currentImageBase = currentImageUrl.split("?")[0];

        // If the Discord image URL has changed, update the person's image in Sanity
        if (storedImageBase !== currentImageBase) {
          console.log("Updating profile image globally...");

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
                refetchPerson();
              },
              onError: (error) => {
                console.error("Error updating profile image globally:", error);
              },
            }
          );
        }
      } catch (error) {
        console.error("Error updating profile image globally:", error);
      }
    },
    [refetchPerson, updateProfileImage]
  );

  useEffect(() => {
    if (session && session.user && personData && session.user.image) {
      const lastUpdateTime = localStorage.getItem(
        `profile_update_${personData._id}`
      );
      const currentTime = Date.now();

      // Only update if it's been more than 24 hours since the last update
      if (
        !lastUpdateTime ||
        currentTime - parseInt(lastUpdateTime) > 24 * 60 * 60 * 1000
      ) {
        updateProfileImageIfChanged(personData, session.user.image);
      }
    }
  }, [session, personData, updateProfileImageIfChanged]);

  return null; // This component doesn't render anything
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: {
  Component: any;
  pageProps: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageKey, setPageKey] = useState("");
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    // Set the page key based on the route
    setPageKey(router.asPath);

    // Fade in the new page
    setFadeIn(true);
  }, [router.asPath]);

  useEffect(() => {
    // Track if we should show loading state
    let loadingTimeout: NodeJS.Timeout;

    const handleStart = (url: string) => {
      // Only show loading for navigation to new pages, not for cached pages
      const currentPath = router.asPath;
      const targetPath = url.split("?")[0];

      // Skip loading state for cached pages
      if (currentPath !== targetPath) {
        console.log("Route change started:", currentPath, "->", targetPath);

        // Start fading out the current page
        setFadeIn(false);

        // Only show loading spinner after a delay (to avoid flashing for fast loads)
        clearTimeout(loadingTimeout);
        loadingTimeout = setTimeout(() => {
          setLoading(true);
        }, 300);
      }
    };

    const handleComplete = () => {
      console.log("Route change completed");

      // Clear the loading timeout to prevent showing spinner for fast loads
      clearTimeout(loadingTimeout);

      // Hide loading spinner immediately
      setLoading(false);

      // Fade in the new page after a short delay
      setTimeout(() => {
        setFadeIn(true);
      }, 100);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      clearTimeout(loadingTimeout);
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <Provider>
          <ProfileImageUpdater />
          {loading && (
            <div className="fixed inset-0 flex justify-center items-center bg-black/90 z-50 animate-fadeIn">
              <div className="flex flex-col items-center">
                <ColorRing
                  visible={true}
                  height="80"
                  width="80"
                  ariaLabel="blocks-loading"
                  wrapperStyle={{}}
                  wrapperClass="blocks-wrapper"
                  colors={[
                    "#cacaca",
                    "#cacaca",
                    "#cacaca",
                    "#cacaca",
                    "#cacaca",
                  ]}
                />
                <p className="text-gray-300 mt-4 text-sm">Laster inn...</p>
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
              fadeIn ? "opacity-100" : "opacity-0"
            }`}
            key={pageKey}
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
