import React from "react";
import { Carousel } from "react-responsive-carousel";
import MovieTitle from "./MovieTitle";
import Image from "next/image";

type Props = {
  children: React.ReactNode;
  url: string;
  movie: any;
};

function HomepageImage({ children, url, movie }: Props) {
  return (
    <div
      className="relative
      bg-cover bg-center bg-no-repeat
      h-screen
      w-screen
      "
      style={{ height: "100vh" }}
    >
      <Image
        style={{}}
        className=" 
        z-0
        opacity-50
        w-screen
        "
        src={url}
        alt="Homepage background"
        width={0}
        height={0}
        sizes="100vh"
      />
      <div className="absolute top-0 left-0 w-full h-full">{children}</div>
    </div>
  );
}

export default HomepageImage;
