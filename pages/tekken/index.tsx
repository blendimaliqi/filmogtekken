import React, { useEffect, useState } from "react";

const Tekken = () => {
  const [numberOfVideos, setNumberOfVideos] = useState(2);

  return (
    <main className="h-screen">
      <div className="flex flex-col justify-center items-center m-56">
        {Array.from({ length: numberOfVideos }, (_, i) => (
          <iframe
            key={i}
            className="w-3/5 h-[500px] mb-28 mt-10 rounded-3xl
            "
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
