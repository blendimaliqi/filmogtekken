import Image from "next/image";
import { Inter } from "next/font/google";
import Nav from "@/components/Nav";
import HomepageImage from "@/components/HomepageImage";

export default function Home() {
  return (
    <main>
      <HomepageImage>

      <Nav />
      </HomepageImage>
     
    </main>
  );
}
