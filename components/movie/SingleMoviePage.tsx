import React, { useState } from "react";
import Head from "next/head";
import { ColorRing } from "react-loader-spinner";
import { useRouter } from "next/router";
import { Movie } from "@/typings";
import MovieHero from "./MovieHero";
import MovieContent from "./MovieContent";

// Style for centering loading spinner
const centerStyle = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
} as const;

interface SingleMoviePageProps {
  movieData: Movie;
  contentVisible: boolean;
  isLoading: boolean;
  isRouteLoading: boolean;
  session: any;
  open: boolean;
  setOpen: (value: boolean) => void;
  rateMovie: (movieId: string, rating: number) => Promise<void>;
  error: any;
  refetch: () => void;
}

function SingleMoviePage({
  movieData,
  contentVisible,
  isLoading,
  isRouteLoading,
  session,
  open,
  setOpen,
  rateMovie,
  error,
  refetch,
}: SingleMoviePageProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div style={centerStyle}>
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
    );
  }

  if (error) {
    console.error("Error loading movie:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Error loading movie</h1>
        <p className="text-gray-400 mb-6">
          {error instanceof Error
            ? error.message
            : "We encountered a problem while loading this movie."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-lg"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (!movieData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
        <p className="text-gray-400 mb-6">
          We couldn&apos;t find the movie you&apos;re looking for.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-lg"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <main className="bg-black min-h-screen">
      <Head>
        <title>{movieData.title ?? ""}</title>
        <meta name="description" content={movieData.plot || ""} />
      </Head>

      {/* Loading overlay - shown during route changes */}
      {isRouteLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <ColorRing
            visible={true}
            height="80"
            width="80"
            ariaLabel="loading-spinner"
            wrapperStyle={{}}
            wrapperClass="blocks-wrapper"
            colors={["#cacaca", "#cacaca", "#cacaca", "#cacaca", "#cacaca"]}
          />
        </div>
      )}

      {/* Hero section with backdrop and main movie info */}
      <MovieHero
        movieData={movieData}
        contentVisible={contentVisible}
        session={session}
        setOpen={setOpen}
        open={open}
      />

      {/* Content section with ratings and comments */}
      <MovieContent
        movieData={movieData}
        contentVisible={contentVisible}
        open={open}
        setOpen={setOpen}
        rateMovie={rateMovie}
        session={session}
        refetch={refetch}
      />
    </main>
  );
}

export default SingleMoviePage;
