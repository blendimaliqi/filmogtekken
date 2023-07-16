import React, { useEffect, useState } from "react";

const Tekken: React.FC = () => {
  const [numberOfVideos] = useState<number>(3);
  const [hoveredVideoIndex, setHoveredVideoIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    const handleMouseEnter = (index: number) => {
      setHoveredVideoIndex(index);
    };

    const handleMouseLeave = () => {
      setHoveredVideoIndex(null);
    };

    const iframes = document.querySelectorAll(".video-frame");
    iframes.forEach((iframe, index) => {
      iframe.addEventListener("mouseenter", () => handleMouseEnter(index));
      iframe.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      iframes.forEach((iframe, index) => {
        iframe.removeEventListener("mouseenter", () => handleMouseEnter(index));
        iframe.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  return (
    <main className=" flex justify-center items-center">
      <div className="flex flex-col items-center mt-64 w-[80%] md:w-[60%] lg:w-[50%]">
        {Array.from({ length: numberOfVideos }, (_, i) => (
          <iframe
            key={i}
            className={`w-full h-[500px] mb-28 mt-10 rounded-3xl video-frame ${
              hoveredVideoIndex === i ? "scale-110" : ""
            } transition-transform`}
            src={`https://www.youtube.com/embed?list=UULFwjlbRtoNraIuDGQIfg-WBw&index=${
              i + 1
            }`}
          ></iframe>
        ))}
      </div>
    </main>
  );
};

export default Tekken;
