import React from "react";

type Props = {
  children: React.ReactNode;
  url: string;
};

function HomepageImage({ children, url }: Props) {
  return (
    <div
      className="relative h-screen w-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${url})`,
        //show the image as is and not cover the whole div
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {children}
    </div>
  );
}

export default HomepageImage;
