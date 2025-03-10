import React from "react";
import RatingModal from "@/components/modal/RatingModal";
import RatingList from "./RatingList";
import CommentForm from "@/components/CommentForm";
import { Movie } from "@/typings";

interface MovieContentProps {
  movieData: Movie;
  contentVisible: boolean;
  open: boolean;
  setOpen: (value: boolean) => void;
  rateMovie: (movieId: string, rating: number) => Promise<void>;
  session: any;
  refetch: () => void;
}

function MovieContent({
  movieData,
  contentVisible,
  open,
  setOpen,
  rateMovie,
  session,
  refetch,
}: MovieContentProps) {
  return (
    <div
      className={`relative max-w-7xl mx-auto px-4 md:px-8 pb-20 transition-opacity duration-700 delay-200 ${
        contentVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <RatingModal
        open={open}
        setOpen={setOpen}
        rateMovie={rateMovie}
        movieId={movieData._id}
      />

      <RatingList ratings={movieData.ratings} />

      {session ? (
        <div id="comments" className="mt-20">
          <CommentForm
            movieId={movieData._id}
            session={session}
            movieData={movieData}
            refetch={refetch}
          />
        </div>
      ) : null}
    </div>
  );
}

export default MovieContent;
