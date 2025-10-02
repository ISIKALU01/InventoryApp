import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getLocalStorage, verifyToken } from '../../utils/auth';

export default function withAuth(WrappedComponent, allowedRoles = []) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
      const checkAuthentication = async () => {
        const token = getLocalStorage('token');
        
        if (!token) {
          router.replace('/');
          return;
        }

        try {
          const session = await verifyToken(token);
          
          if (!session?.user) {
            localStorage.removeItem('token');
            router.replace('/');
            return;
          }

          // Check if user role is allowed for this page
          if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
            router.replace('/unauthorized');
            return;
          }

          setUser(session.user);
          setIsLoading(false);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          router.replace('/');
        }
      };

      checkAuthentication();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    return <WrappedComponent {...props} user={user} />;
  };
}