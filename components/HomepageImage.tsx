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
      className="relative bg-cover bg-center bg-no-repeat"
      style={{ height: "85vh" }}
    >
      <Image
        style={{}}
        className="z-0 opacity-50"
        src={url}
        alt="Homepage background"
        width={0}
        height={0}
        sizes="100vh"
      />
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          // Set the background color of the pseudo-element to transparent
          // and set its opacity to increase from top to bottom
          background: "linear-gradient(to bottom, transparent, #0d0d0d)",
        }}
      />
      <div
        className="absolute inset-0 
        
      "
      >
        {children}
      </div>
    </div>
  );
}

export default HomepageImage;
