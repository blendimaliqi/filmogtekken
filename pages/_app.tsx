import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import { client } from "../config/client";
import { ToastContainer } from "react-toastify";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      <ToastContainer />
    </QueryClientProvider>
  );
}
