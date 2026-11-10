// pages/_app.js
import { raleway } from '../../libs/fonts';
import Layout from '../components/Layout';
import '../styles/globals.css'
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import RouteGuard from '../components/RouteGuard';
import IdleSignOut from '../components/IdleSignOut';
import { isPublicPath } from '../../utils/permissions';
import { APPEARANCE_KEY, applyAppearance, loadAppearance } from '../../utils/appearance';
import { startOffline } from '../offline/connection';
import { startAutoSync } from '../offline/salesQueue';

export default function MyApp({ 
  Component, 
  pageProps: { session, ...pageProps } 
}) {
  const router = useRouter();

  // Offline mode: save the app so it opens without internet (public/sw.js)
  useEffect(() => {
    startOffline();
    // Offline sales saved on this computer sync by themselves when it's back
    startAutoSync();
  }, []);

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
        <IdleSignOut />
      </main>
    </AuthProvider>
  );
}