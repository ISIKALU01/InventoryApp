import { Html, Head, Main, NextScript } from "next/document";
import { appearanceScript } from "../../utils/appearance";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Apply saved theme/accent/size before first paint */}
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
        {/* Installable as a desktop app (Edge/Chrome: "Install SellaPad"), works offline via /sw.js */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
