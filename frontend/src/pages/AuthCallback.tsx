import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/api';
import authService from '../services/authService';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('Auth callback page loaded, handling OAuth response');
        
        // Get the current session to see if sign-in was successful
        setStatus('Authenticating...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (session) {
          setStatus('Session found, attempting to get user data from backend...');
          
          try {
            const userData = await authService.getCurrentUser();
            
            // Important: Add a small delay before navigation to ensure state is updated
            setStatus('Successfully authenticated! Redirecting...');
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 1000);
          } catch (userDataError) {
            // If we have a session but failed to get user data, still try to proceed
            setStatus('Error getting user data, but proceeding with session...');
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 1000);
          }
        } else {
          setError('No session established. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              Authentication in progress...
            </h2>
            <div className="text-gray-600 dark:text-gray-300 mb-4">
              {status}
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 