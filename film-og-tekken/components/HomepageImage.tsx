import React from "react";

type Props = {
  children: React.ReactNode;
};

function HomepageImage({ children }: Props) {
  return (
    <div
      className="relative h-screen w-screen bg-cover bg-center"
      style={{
        backgroundImage: `url("https://image.tmdb.org/t/p/original//hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg")`,
      }}
    >
      {children}
    </div>
  );
}

export default HomepageImage;
