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
      <Image
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        className="z-0 opacity-60"
        src={url}
        alt="Homepage background"
        width={0}
        height={0}
        sizes="100vw"
        priority
      />
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: "linear-gradient(to bottom, transparent 30%, #000000 95%)",
        }}
      />
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

export default HomepageImage;
