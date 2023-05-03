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
    <div className="relative h-screen w-screen bg-cover bg-center">
      <Image
        className="absolute top-0 left-0 w-full h-full object-contain 
        //opacity 50%
        opacity-70
        //blur
        filter blur-[4px]        
        "
        src={url}
        alt="Homepage background"
        width={1920}
        height={1080}
      />

      {children}
    </div>
  );
}

export default HomepageImage;
