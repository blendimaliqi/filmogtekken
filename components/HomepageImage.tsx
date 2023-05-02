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
      }}
    >
      {children}
    </div>
  );
}

export default HomepageImage;
