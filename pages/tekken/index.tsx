import { client } from "@/config/client";
import React, { useEffect, useState } from "react";
import Video from "./video";
import { ColorRing } from "react-loader-spinner";
import { centerStyle } from "@/pages";

// Define the type for video data
interface VideoData {
  title: string;
  author: string;
  videoFile: {
    asset: {
      _ref: string;
      url: string;
    };
  };
}

const Tekken = () => {
  const [videoData, setVideoData] = useState<VideoData[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const result: VideoData[] = await client.fetch('*[_type == "video"]');
        if (result.length > 0) {
          setVideoData(result);
          const assetPromises = result.map((video) =>
            client.fetch(`*[_id == "${video.videoFile.asset._ref}"]{url}[0]`)
          );
          const assets = await Promise.all(assetPromises);
          const urls = assets.map((asset: { url: string }) => asset.url);
          setVideoUrls(urls);
        }
      } catch (error) {
        console.error("Error fetching video data:", error);
      }
    };

    fetchVideoData();
  }, []);

  if (videoData.length === 0 || videoData.length !== videoUrls.length) {
    return (
      <div
        className="
    fixed
    inset-0
    flex
    justify-center
    items-center
  "
      >
        <div style={centerStyle}>
          <ColorRing
            visible={true}
            height="80"
            width="80"
            ariaLabel="blocks-loading"
            wrapperStyle={{}}
            wrapperClass="blocks-wrapper"
            colors={["#cacaca", "#cacaca", "#cacaca", "#cacaca", "#cacaca"]}
          />
        </div>
      </div>
    );
  }

  return (
    <main
      className="h-screen
      


      
    "
    >
      <div className="flex flex-col justify-center items-center m-56">
        {videoData.map((video, index) => (
          <div
            key={index}
            className="
            w-3/5
            mx-auto
            p-4
            rounded-lg
            text-xl
            font-semibold
            flex
            justify-center
            items-center
          "
          >
            <Video videoData={video} videoUrl={videoUrls[index]} />
          </div>
        ))}
      </div>
    </main>
  );
};

export default Tekken;
