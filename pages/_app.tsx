import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Image from "next/image";
import Head from "next/head";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
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

// Component to handle profile image updates
function ProfileImageUpdater() {
  const { data: session } = useSession();
  
  // Query to get the current user's person record
  const { data: personData, refetch: refetchPerson } = useQuery({
    queryKey: ["globalCurrentPerson"],
    enabled: !!session && !!session.user,
    queryFn: async () => {
      if (!session || !session.user || !session.user.name) return null;
      const personQuery = `*[_type == "person" && name == "${session.user.name}"]`;
      const result = await client.fetch(personQuery);
      return result[0] || null;
    },
  });

  const updateProfileImageIfChanged = useCallback(async (person: any, currentImageUrl: string) => {
    if (!person || !person.image || !person.image.asset) return;
    
    try {
      const storedImageUrl = urlFor(person.image).url();
      
      // Extract just the base URL without query parameters for comparison
      const storedImageBase = storedImageUrl.split('?')[0];
      const currentImageBase = currentImageUrl.split('?')[0];
      
      // If the Discord image URL has changed, update the person's image in Sanity
      if (storedImageBase !== currentImageBase) {
        console.log("Updating profile image globally...");
        const imageAsset = await uploadExternalImage(currentImageUrl);
        
        await clientWithToken
          .patch(person._id)
          .set({
            image: {
              _type: "image",
              asset: {
                _ref: imageAsset._id,
              },
            },
          })
          .commit();
          
        console.log("Profile image updated successfully globally");
        localStorage.setItem(`profile_update_${person._id}`, Date.now().toString());
        refetchPerson();
      }
    } catch (error) {
      console.error("Error updating profile image globally:", error);
    }
  }, [refetchPerson]);

  useEffect(() => {
    if (session && session.user && personData && session.user.image) {
      const lastUpdateTime = localStorage.getItem(`profile_update_${personData._id}`);
      const currentTime = Date.now();
      
      // Only update if it's been more than 24 hours since the last update
      if (!lastUpdateTime || (currentTime - parseInt(lastUpdateTime)) > 24 * 60 * 60 * 1000) {
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
  const queryClient = new QueryClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => {
      setTimeout(() => {
        setLoading(false);
      }, 100); // Small delay to ensure smooth transition
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
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
            <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
              <ColorRing
                visible={true}
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={["#cacaca", "#cacaca", "#cacaca", "#cacaca", "#cacaca"]}
              />
            </div>
          )}
          <Head>
            <title>Film med Gutta</title>
          </Head>
          <style>{`body { overflow-x: hidden; }`}</style>
          
          <div style={{ position: "absolute", top: "0", left: "0", zIndex: "20", width: "100%" }}>
            <Nav />
          </div>
          <div className="flex flex-col justify-center items-center">
            <MiniNav />
          </div>
          <div className="pt-0 md:pt-0">
            <Component {...pageProps} />
          </div>
          
          <ToastContainer />
        </Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
