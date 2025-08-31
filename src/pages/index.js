// pages/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

// For local images, you would import them like this:
// import professionalImage from '../public/images/professional-woman.jpg';
// import workspaceImage from '../public/images/workspace.jpg';

// Since we're using remote images in this example, we'll use the Next.js Image component with remote URLs
// For local images, you would use: <Image src={professionalImage} alt="Professional woman" />

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Admin password (in a real app, this would be validated server-side)
  const ADMIN_PASSWORD = 'admin123';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate inputs
    if (!username.trim()) {
      setError('Username is required');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      // Store authentication data
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', username);
      
      // Route based on password
      if (password === ADMIN_PASSWORD) {
        localStorage.setItem('userRole', 'admin');
        router.push('/admin-dashboard');
      } else {
        localStorage.setItem('userRole', 'staff');
        router.push('/staff-dashboard');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex font-raleway">
     

      {/* Image Section - Hidden on mobile */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-r from-indigo-900 to-purple-800 relative">
        <Image
          src="https://images.unsplash.com/photo-1589156280159-27698a70f29e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80"
          alt="Professional woman"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover opacity-90"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAFAAUDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAeEAABBAIDAQAAAAAAAAAAAAABAAIDBAUREiExUf/EABUBAQEAAAAAAAAAAAAAAAAAAAIE/8QAGBEAAgMAAAAAAAAAAAAAAAAAAAECETH/2gAMAwEAAhEDEQA/AJvH5G9XqRRxWpmMaNGnOICIslYc7ckjif/Z"
        />
        <div className="absolute inset-0 bg-indigo-900 opacity-80"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 font-raleway w-full">
          <h1 className="text-4xl font-raleway mb-6 text-center">Inventory Management System</h1>
          <p className="text-xl font-raleway text-center max-w-md">Efficiently manage your inventory with our powerful system</p>
          
          <div className="mt-12 space-y-4">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span>Secure authentication</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                </svg>
              </div>
              <span>Advanced reporting</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span>User management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12">
        {/* Mobile background image (blurry) */}
        <div className="md:hidden fixed inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
            alt="Professional workspace"
            fill
            priority
            sizes="100vw"
            className="object-cover filter blur-sm"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAFAAUDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAeEAABBAIDAQAAAAAAAAAAAAABAAIDBAUREiExUf/EABUBAQEAAAAAAAAAAAAAAAAAAAIE/8QAGBEAAgMAAAAAAAAAAAAAAAAAAAECETH/2gAMAwEAAhEDEQA/AJvH5G9XqRRxWpmMaNGnOICIslYc7ckjif/Z"
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>

        <div className="w-full font-raleway max-w-md bg-white shadow-xl z-10 md:shadow-none md:rounded-none md:bg-transparent">
          <div className="bg-white py-8 px-6 rounded-2xl shadow-lg md:shadow-xl md:px-8">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center bg-indigo-900 text-white rounded-full w-20 h-20 shadow-lg">
                <span className="text-2xl font-raleway font-bold">PGIMS</span>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="mt-2 text-gray-600">Sign in to your account</p>
            </div>
            
            <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    className="py-3 pl-10 pr-4 block w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="py-3 pl-10 pr-4 block w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Use password <span className="font-mono">admin123</span> for admin access
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-900 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : 'Sign in'}
                </button>
              </div>
            </form>
            
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">Demo Instructions:</h3>
              <ul className="mt-2 text-xs text-blue-600 space-y-1">
                <li>• Enter any username</li>
                <li>• Use password <span className="font-mono">admin123</span> to access Admin Dashboard</li>
                <li>• Use any other password to access Staff Dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}