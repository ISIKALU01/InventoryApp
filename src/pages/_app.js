// pages/_app.js
import { SessionProvider } from "next-auth/react";
import { raleway } from '../../libs/fonts';
import '../styles/globals.css'

export default function MyApp({ 
  Component, 
  pageProps: { session, ...pageProps } 
}) {
  return (
    <SessionProvider session={session}>
      <main className={raleway.className}>
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
}

