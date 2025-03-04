import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Image from "next/image";
import Head from "next/head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import { SessionProvider } from "next-auth/react";
import Nav from "@/components/Nav";
import MiniNav from "@/components/MiniNav";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ColorRing } from "react-loader-spinner";

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
