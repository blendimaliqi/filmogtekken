import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { client } from "../config/client";
import { ToastContainer } from "react-toastify";
import Head from "next/head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";

export const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <Head>
          <title>Film og Tekken</title>
        </Head>
        <Component {...pageProps} />
      </Provider>
    </QueryClientProvider>
  );
}
