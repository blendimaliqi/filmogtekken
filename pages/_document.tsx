import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head title="Film og Tekken" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <body className=" scrollbar-thumb-gray-600 scrollbar-track-transparent scrollbar-track-rounded-full scrollbar-thin">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
