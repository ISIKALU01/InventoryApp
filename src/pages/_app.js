// pages/_app.js
import { raleway } from '../../libs/fonts';
import Layout from '../components/Layout';
import '../styles/globals.css'
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getLocalStorage } from '../../utils/auth';

export default function MyApp({ 
  Component, 
  pageProps: { session, ...pageProps } 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = () => {
      const protectedRoutes = ['/admin-dashboard', '/staff-dashboard'];
      const currentPath = router.pathname;

      // Don't check auth for login page
      if (currentPath === '/') {
        setIsLoading(false);
        return;
      }

      // Check if current route is protected
      if (protectedRoutes.includes(currentPath)) {
        const token = getLocalStorage('token');
        
        if (!token) {
          console.log('🚫 No token found, redirecting to login');
          router.push('/');
          return;
        }
        
        console.log('✅ Token found, allowing access to protected route');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [router.pathname, router]);

  // Show loading while checking authentication
  if (isLoading && router.pathname !== '/') {
    return (
      <main className={raleway.className}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
      <main className={raleway.className}>
        {router.pathname === '/' ? (
          <Component {...pageProps} />
        ) : (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </main> 
  );
}