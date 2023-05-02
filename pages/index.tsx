import Image from "next/image";
import { Inter } from "next/font/google";
import Nav from "@/components/Nav";
import HomepageImage from "@/components/HomepageImage";
import MovieTitle from "@/components/MovieTitle";
import Movies from "@/components/Movies";

export default function Home() {
  return (
    <main>
      <HomepageImage>
        <Nav />
        <MovieTitle />
      </HomepageImage>
      <Movies />
    </main>
  );
}
