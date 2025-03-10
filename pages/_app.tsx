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
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  ErrorInfo,
  Component,
} from "react";
import { ToastContainer, toast } from "react-toastify";
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
  },
});

// Error boundary component to catch and display errors
class ErrorBoundary extends Component<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);

    // On mobile, errors are often not visible in the console
    // Store error details in localStorage for debugging
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "lastError",
          JSON.stringify({
            message: error.message,
            stack: error.stack,
            time: new Date().toISOString(),
          })
        );
      } catch (storageError) {
        console.error("Could not store error in localStorage:", storageError);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <h2 className="text-xl font-bold text-yellow-500 mb-4">
              Something went wrong
            </h2>
            <p className="mb-4 text-center">
              The application encountered an error. Please try refreshing the
              page.
            </p>
            <pre className="text-xs text-gray-400 bg-gray-900 p-3 rounded max-w-full overflow-x-auto">
              {this.state.error ? this.state.error.toString() : "Unknown error"}
            </pre>
            <button
              className="mt-6 bg-yellow-600 px-4 py-2 rounded"
              onClick={() => (window.location.href = "/")}
            >
              Go to Homepage
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Reference to store the loading timer
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Reference to store the safety timer
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Safe check for mobile - with error handling
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    try {
      const checkMobile = () => {
        if (typeof window !== "undefined") {
          setIsMobile(window.innerWidth < 768);
        }
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    } catch (error) {
      console.error("Error setting up mobile detection:", error);
    }
  }, []);

  // Safety reset for loading state
  useEffect(() => {
    if (isLoading) {
      // If loading state is true, set a safety timeout to reset it after 8 seconds
      // This ensures the spinner never gets stuck indefinitely
      safetyTimerRef.current = setTimeout(() => {
        console.log("Safety timeout triggered to reset loading state");
        setIsLoading(false);
      }, 8000);

      return () => {
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
        }
      };
    }
  }, [isLoading]);

  // Setup loading indicators for route changes
  const handleStart = (url: string) => {
    // Clear any existing timer to prevent state inconsistencies
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    // Clear safety timer as well
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
    }

    // Check if we're navigating back to the homepage
    const isNavigatingToHome = url === "/" || url === "";

    // Check if we have cached data for this route
    // Use the correct query key structure that matches useMovies hook
    const hasMoviesList = queryClient.getQueryData([
      "movies",
      "list",
      { filters: "all" },
    ]);

    // For movie detail pages, check if we have that specific movie cached
    const targetSlug = url.split("/").pop();
    const hasTargetMovieCache =
      targetSlug && queryClient.getQueryData(["movies", "detail", targetSlug]);

    // Don't show loading for cached routes
    if ((isNavigatingToHome && hasMoviesList) || hasTargetMovieCache) {
      setIsLoading(false);
      return;
    }

    // Set a short delay before showing the loading spinner
    // This prevents flash of loading state for quick navigations
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(true);
    }, 300);
  };

  const handleComplete = () => {
    // Clear the timer to prevent setting isLoading to true after navigation completes
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    // Clear safety timer as well
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
    }

    setIsLoading(false);
  };

  const handleError = () => {
    // Clear the timer to prevent setting isLoading to true after navigation fails
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    // Clear safety timer as well
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleError);

    return () => {
      // Clean up timers on unmount
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleError);
    };
  }, [router]);

  // Set up global error handling
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Capture the error and set it to state to show a notification
      console.error("Global error captured:", event.error || event.message);
      const errorMessage =
        event.error?.message || event.message || "An unknown error occurred";

      // Only show toast for certain errors, avoid spamming the user
      if (errorMessage.includes("undefined is not an object")) {
        setErrorMessage(
          "The app encountered an error. Please try refreshing the page."
        );
      }

      // Store in localStorage for debugging on mobile
      try {
        localStorage.setItem(
          "lastGlobalError",
          JSON.stringify({
            message: errorMessage,
            time: new Date().toISOString(),
          })
        );
      } catch (storageError) {
        console.error("Could not store error in localStorage:", storageError);
      }
    };

    // Set up the event listener
    window.addEventListener("error", handleError);

    // Mark the component as mounted to enable client-side only code
    setIsMounted(true);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  // Show toast for error message
  useEffect(() => {
    if (errorMessage && isMounted) {
      toast.error(errorMessage, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Clear the error message after showing it
      setErrorMessage(null);
    }
  }, [errorMessage, isMounted]);

  // Add extra safeguards for mobile
  useEffect(() => {
    if (isMobile && isMounted) {
      // Add throttled window access to prevent potential errors
      const throttle = (fn: Function, delay: number) => {
        let lastCall = 0;
        return (...args: any[]) => {
          const now = Date.now();
          if (now - lastCall < delay) return;
          lastCall = now;
          return fn(...args);
        };
      };

      // Safely access window properties
      const safeWindowAccess = throttle(() => {
        try {
          // Do any necessary window access here
          // This is just a safety mechanism
        } catch (error) {
          console.error("Error with window access:", error);
        }
      }, 500);

      // Set up safely
      try {
        window.addEventListener("scroll", safeWindowAccess);
        return () => window.removeEventListener("scroll", safeWindowAccess);
      } catch (error) {
        console.error("Error setting up mobile safeguards:", error);
      }
    }
  }, [isMobile, isMounted]);

  return (
    <SessionProvider session={session}>
      <Provider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <Head>
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1, maximum-scale=1"
              />
              <meta name="description" content="Film med Gutta" />
              <title>Film med Gutta</title>
              <link rel="icon" href="/favicon.ico" />
              <link rel="manifest" href="/site.webmanifest" />
            </Head>
            <ProfileImageUpdater />
            {isLoading && (
              <div className="fixed inset-0 flex justify-center items-center bg-black/90 z-50 animate-fadeIn">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500"></div>
                </div>
              </div>
            )}
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
          </ErrorBoundary>
        </QueryClientProvider>
      </Provider>
    </SessionProvider>
  );
}
