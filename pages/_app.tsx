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
import { useEffect, useState } from "react";
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

  // Check if user's profile image has changed and update it
  useEffect(() => {
    if (session && session.user && personData && session.user.image) {
      updateProfileImageIfChanged(personData, session.user.image);
    }
  }, [session, personData]);

  async function updateProfileImageIfChanged(person: any, currentImageUrl: string) {
    if (!person || !person.image || !person.image.asset) return;
    
    try {
      // Get the current image URL from Sanity
      const storedImageUrl = urlFor(person.image).url();
      
      // If the Discord image URL has changed, update the person's image in Sanity
      if (storedImageUrl !== currentImageUrl) {
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
        refetchPerson();
      }
    } catch (error) {
      console.error("Error updating profile image globally:", error);
    }
  }

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
          <style>{`body { overflow-x: hidden; }`}</style>{" "}
          {/* Prevent horizontal scroll */}
          <div
            style={{ position: "absolute", top: "0", left: "0", zIndex: "2" }}
          >
            <Nav />
          </div>
          <div className="flex flex-col justify-center items-center">
            <Image
              style={{
                zIndex: "9000000",
              }}
              className="flex md:hidden 
            mx-auto
            mt-64
            z-50"
              src="/fmg.png"
              alt="Film med Gutta logo"
              width={200}
              height={300}
            />
            <MiniNav />
          </div>
          <Component {...pageProps} />
          <ToastContainer />
        </Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
