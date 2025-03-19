import React, { useState } from "react";
import { Modal } from "@mui/material";
import { Rating } from "@mui/material";

type RatingModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  movieId: string;
  rateMovie: (movieId: string, rating: number) => Promise<void>;
};

function RatingModal({ open, setOpen, rateMovie, movieId }: RatingModalProps) {
  const [ratingStar, setRatingStar] = useState(0);

  function handleRating(value: number) {
    setRatingStar(0); // Reset rating star
    setOpen(false); // Close modal first

    // Delay the rating call to avoid race conditions
    setTimeout(() => {
      rateMovie(movieId, value);
    }, 100);
  }

  return (
    <div>
      <Modal
        className="flex
        flex-col
        justify-center
        items-center
        "
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="p-10 bg-gray-800 flex flex-col justify-center items-center rounded-lg">
          <h1 className="text-xl">Ranger film</h1>
          <h3 className="font-semibold pt-4 ">Brutal ærlighet</h3>
          <Rating
            onChangeActive={(event, newHover) => {
              newHover > 0 ? setRatingStar(newHover) : setRatingStar(0);
            }}
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
          <p
            className="
          text-white font-semibold text-xl mt-5"
          >
            {ratingStar}
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default RatingModal;
