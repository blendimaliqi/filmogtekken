import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { client } from "../config/client";
import { ToastContainer } from "react-toastify";
import Head from "next/head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import { SessionProvider } from "next-auth/react";
import Nav from "@/components/Nav";

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
            <title>Film og Tekken</title>
          </Head>
          <div
            style={{ position: "absolute", top: "0", left: "0", zIndex: "2" }}
          >
            <Nav />
          </div>
          <Component {...pageProps} />
        </Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
