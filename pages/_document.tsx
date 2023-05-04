import Nav from '@/components/Nav';
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head  title='Film og Tekken'/>
      <body>
        <div style={{ position: "absolute", top: "0", left: "0", zIndex: "2" }}>
          <Nav />
        </div>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
