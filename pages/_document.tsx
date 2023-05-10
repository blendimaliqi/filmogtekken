import HamburgerMenu from "@/components/HamburgerMenu";
import Nav from "@/components/Nav";
import { Html, Head, Main, NextScript } from "next/document";
import Image from "next/image";
import MiniNav from "@/components/MiniNav";

export default function Document() {
  return (
    <Html lang="en">
      <Head title="Film og Tekken" />
      <body>
        <div style={{ position: "absolute", top: "0", left: "0", zIndex: "2" }}>
          <Nav />
        </div>
        <div>
          <Image
            className="flex md:hidden 
            mx-auto
            mt-64
            "
            src="/ft.png"
            alt="Film og Tekken logo"
            width={200}
            height={300}
          />
          <MiniNav />
        </div>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
