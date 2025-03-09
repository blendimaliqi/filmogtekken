import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon links */}
        <link rel="icon" href="/fmg.png" sizes="any" />
        <link rel="icon" href="/fmg.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/fmg.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/fmg.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body className="scrollbar-thumb-gray-600 scrollbar-track-transparent scrollbar-track-rounded-full scrollbar-thin">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
