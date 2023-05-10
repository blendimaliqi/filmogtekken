import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import { client } from "../config/client";
import { ToastContainer } from "react-toastify";
import Head from "next/head";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Film og Tekken</title>
      </Head>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
