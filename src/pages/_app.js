// pages/_app.js
import { SessionProvider } from "next-auth/react";
import { raleway } from '../../libs/fonts';
import Layout from '../components/Layout';
import '../styles/globals.css'
import { useRouter } from 'next/router';

export default function MyApp({ 
  Component, 
  pageProps: { session, ...pageProps } 
}) {
  const router = useRouter();
  
  return (
    <SessionProvider session={session}>
      <main className={raleway.className}>
        {router.pathname === '/' ? (
          <Component {...pageProps} />
        ) : (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </main>
    </SessionProvider>
  );
}