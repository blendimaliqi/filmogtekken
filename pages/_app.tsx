import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Image from "next/image";
import Head from "next/head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import { SessionProvider } from "next-auth/react";
import Nav from "@/components/Nav";
import MiniNav from "@/components/MiniNav";

export const queryClient = new QueryClient();

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <Provider>
          <Head>
            <title>Film med Gutta</title>
          </Head>
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
        </Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
