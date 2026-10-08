// pages/_app.js
import { raleway } from '../../libs/fonts';
import Layout from '../components/Layout';
import '../styles/globals.css'
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import RouteGuard from '../components/RouteGuard';
import { isPublicPath } from '../../utils/permissions';
import { APPEARANCE_KEY, applyAppearance, loadAppearance } from '../../utils/appearance';

export default function MyApp({ 
  Component, 
  pageProps: { session, ...pageProps } 
}) {
  const router = useRouter();

  // Keep appearance in step with the device ("System" theme) and other tabs
  useEffect(() => {
    applyAppearance(loadAppearance());

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (loadAppearance().theme === 'system') applyAppearance(loadAppearance());
    };
    const onStorage = (e) => {
      if (e.key === APPEARANCE_KEY) applyAppearance(loadAppearance());
    };

    media?.addEventListener?.('change', onSystemChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media?.removeEventListener?.('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // RouteGuard sends guests to login and keeps each page to the roles allowed to open it
  return (
    <AuthProvider>
      <main className={raleway.className}>
        <RouteGuard>
          {isPublicPath(router.pathname) ? (
            <Component {...pageProps} />
          ) : (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </RouteGuard>
      </main>
    </AuthProvider>
  );
}