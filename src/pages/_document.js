import { Html, Head, Main, NextScript } from "next/document";
import { appearanceScript } from "../../utils/appearance";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Apply saved theme/accent/size before first paint */}
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
