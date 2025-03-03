import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);

  // Set timeout for loading state to prevent infinite loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      // If still loading after 8 seconds, force navigation
      timer = setTimeout(() => {
        console.log('Loading timeout triggered in ProtectedRoute');
        setTimeoutOccurred(true);
      }, 8000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  // If timeout occurred, check if we have minimal user info to proceed
  if (timeoutOccurred) {
    console.log('Loading timeout occurred, user state:', user);
    
    // If we have a user (even partial data), show the protected content
    if (user?.email) {
      console.log('Proceeding with available user data despite timeout');
      return <>{children}</>;
    }
    
    // Otherwise redirect to login
    console.log('No user data available after timeout, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading your profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute; 