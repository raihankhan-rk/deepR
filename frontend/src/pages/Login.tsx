import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BsEnvelope } from '@react-icons/all-files/bs/BsEnvelope';
import { BsLock } from '@react-icons/all-files/bs/BsLock';
import { BsBoxArrowInRight } from '@react-icons/all-files/bs/BsBoxArrowInRight';
import { FcGoogle } from '@react-icons/all-files/fc/FcGoogle';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { login, signInWithGoogle, isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setIsLoading(true);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError('');
      await signInWithGoogle();
      
      // Add a timeout to reset loading if it takes too long
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setIsGoogleLoading(false);
        }
      }, 8000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-dark-100' : 'bg-gray-50'} py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200`}>
      <div className={`max-w-md w-full ${darkMode ? 'bg-dark-200' : 'bg-white'} shadow-custom rounded-2xl p-8 transition-colors duration-200`}>
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-2">DeepR</h1>
          <h2 className={`mt-4 text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>
            Welcome Back
          </h2>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-200`}>
            Sign in to continue your research journey
          </p>
        </div>
        
        {/* Google Sign In Button */}
        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
              ${darkMode ? 'bg-dark-300 hover:bg-dark-400' : 'bg-white hover:bg-gray-50'} 
              transition-colors duration-200`}
          >
            {isGoogleLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <FcGoogle className="w-5 h-5" />
                <span className={`ml-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  Continue with Google
                </span>
              </>
            )}
          </button>
        </div>

        <div className="mt-8 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className={`px-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Or</div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleFormSubmit}>
          {error && (
            <div className={`${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-500'} border-l-4 p-4 rounded transition-colors duration-200`}>
              <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'} transition-colors duration-200`}>{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsEnvelope className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'} transition-colors duration-200`} />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input pl-10 ${darkMode ? 'bg-dark-300 border-dark-400 text-white' : 'bg-white border-gray-300 text-gray-900'} transition-colors duration-200`}
                placeholder="Email address"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsLock className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'} transition-colors duration-200`} />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input pl-10 ${darkMode ? 'bg-dark-300 border-dark-400 text-white' : 'bg-white border-gray-300 text-gray-900'} transition-colors duration-200`}
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 flex justify-center items-center"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <BsBoxArrowInRight className="mr-2" />
                  Sign in
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-200`}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;