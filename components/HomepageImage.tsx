import React from "react";
import Image from "next/image";

type HomepageImageProps = {
  children: React.ReactNode;
  url: string;
};

function HomepageImage({ children, url }: HomepageImageProps) {
  return (
    <div
      className="relative bg-cover bg-center bg-no-repeat"
      style={{ height: "90vh" }}
    >
      {/* Image with subtle animation */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover",
            transform: "scale(1.05)",
            transition: "transform 10s ease-out"
          }}
          className="z-0 opacity-70 animate-slow-zoom"
          src={url}
          alt="Homepage background"
          width={0}
          height={0}
          sizes="100vw"
          priority
        />
      </div>

      {/* Multiple gradient overlays for depth */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.9) 100%)",
        }}
      />
      <div 
        className="absolute inset-0 z-[2]"
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 z-[3] opacity-60" 
        style={{
          boxShadow: "inset 0 0 150px rgba(0,0,0,0.9)"
        }}
      />
      
      {/* Content container */}
      <div className="absolute inset-0 z-[5]">{children}</div>
    </div>
  );
}

export default HomepageImage;
