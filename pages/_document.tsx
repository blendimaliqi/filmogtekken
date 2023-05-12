import HamburgerMenu from "@/components/HamburgerMenu";
import Nav from "@/components/Nav";
import { Html, Head, Main, NextScript } from "next/document";
import Image from "next/image";
import MiniNav from "@/components/MiniNav";

export default function Document() {
  return (
    <Html lang="en">
      <Head title="Film og Tekken" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <body className=" scrollbar-thumb-gray-600 scrollbar-track-transparent scrollbar-track-rounded-full scrollbar-thin">
        <div style={{ position: "absolute", top: "0", left: "0", zIndex: "2" }}>
          <Nav />
        </div>
        <div style={{ zIndex: "90" }}>
          <Image
            style={{
              zIndex: "9000000",
            }}
            className="flex md:hidden 
            mx-auto
            mt-64
            z-50
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
