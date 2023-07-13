import React, { useState } from "react";
import { Modal } from "@mui/material";
import { Rating } from "@mui/material";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  movieId: string;
  rateMovie: (movieId: string, rating: number) => Promise<void>;
};

function RatingModal({ open, setOpen, rateMovie, movieId }: Props) {
  function handleRating(value: number) {
    console.log(value);
    setOpen(false);
    rateMovie(movieId, value);
  }

  return (
    <div
      className="

    "
    >
      <Modal
        className="    flex
    flex-col
    justify-center
    items-center
    "
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="p-10 bg-gray-800 flex flex-col justify-center items-center rounded-lg">
          <h1 className="text-xl">Ranger film</h1>
          <Rating
            onChange={(event, newValue) => {
              handleRating(newValue ?? 0);
            }}
            size="large"
            name="half-rating"
            max={10}
            precision={0.5}
            color="#fff"
            className="bg-gray-800 p-2 mt-5"
          />
        </div>
      </Modal>
    </div>
  );
}

export default RatingModal;
