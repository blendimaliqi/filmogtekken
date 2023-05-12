import React from "react";

type Props = {
  children: React.ReactNode;
  poster: string;
};

function MoviesWatchedImage({ children, poster }: Props) {
  return (
    <div
      className="
      relative
        h-80    
        w-60
        sm:h-96
        sm:w-72
      "
      style={{
        backgroundImage: `url(${poster})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {children}
    </div>
  );
}

export default MoviesWatchedImage;
