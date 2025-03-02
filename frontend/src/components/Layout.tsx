import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiHome } from '@react-icons/all-files/fi/FiHome';
import { FiSearch } from '@react-icons/all-files/fi/FiSearch';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { FiLogOut } from '@react-icons/all-files/fi/FiLogOut';
import { FiUser } from '@react-icons/all-files/fi/FiUser';
import { FiMenu } from '@react-icons/all-files/fi/FiMenu';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { BsSun } from '@react-icons/all-files/bs/BsSun';
import { BsMoon } from '@react-icons/all-files/bs/BsMoon';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigationItems = [
    { path: '/', icon: <FiHome size={20} />, label: 'Home' },
    { path: '/research', icon: <FiSearch size={20} />, label: 'Research' },
    { path: '/history', icon: <FiClock size={20} />, label: 'History' },
  ];

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-dark-100' : 'bg-gray-50'} transition-colors duration-200`}>
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col w-72 ${darkMode ? 'bg-dark-200 border-dark-300' : 'bg-white border-gray-200'} border-r transition-colors duration-200`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold gradient-text">DeepR</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1 transition-colors duration-200`}>Research Platform</p>
        </div>
        
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center py-3 px-4 rounded-xl transition-colors duration-200 ${
                    location.pathname === item.path
                      ? darkMode 
                        ? 'bg-dark-300 text-primary-400' 
                        : 'bg-primary-50 text-primary-600'
                      : darkMode
                        ? 'text-gray-300 hover:bg-dark-300'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className={`p-4 border-t ${darkMode ? 'border-dark-300' : 'border-gray-200'} transition-colors duration-200`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`${darkMode ? 'bg-dark-300 text-primary-400' : 'bg-primary-100 text-primary-600'} p-2 rounded-full transition-colors duration-200`}>
                <FiUser size={18} />
              </div>
              <div className="ml-3">
                <p className="font-medium text-sm">{user?.username}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>{user?.email}</p>
              </div>
            </div>
            
            {/* Dark mode toggle */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'bg-dark-300 text-yellow-300' : 'bg-gray-100 text-gray-600'} transition-colors duration-200`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <BsSun size={18} /> : <BsMoon size={18} />}
            </button>
          </div>
          
          <button
            onClick={handleLogout}
            className={`flex items-center w-full py-2 px-3 text-sm rounded-lg transition-colors duration-200 ${
              darkMode 
                ? 'text-gray-300 hover:bg-dark-300' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiLogOut size={18} />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 ${darkMode ? 'bg-dark-200 border-dark-300' : 'bg-white border-gray-200'} border-b z-10 transition-colors duration-200`}>
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold gradient-text">DeepR</h1>
          <div className="flex items-center">
            {/* Dark mode toggle for mobile */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 mr-2 rounded-full ${darkMode ? 'bg-dark-300 text-yellow-300' : 'bg-gray-100 text-gray-600'} transition-colors duration-200`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <BsSun size={18} /> : <BsMoon size={18} />}
            </button>
            
            <button
              onClick={toggleMobileMenu}
              className={`p-2 rounded-lg ${
                darkMode 
                  ? 'text-gray-300 hover:bg-dark-300' 
                  : 'text-gray-600 hover:bg-gray-100'
              } transition-colors duration-200`}
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`${darkMode ? 'bg-dark-200 border-dark-300' : 'bg-white border-gray-200'} border-b transition-colors duration-200 py-2`}>
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center py-3 px-4 transition-colors duration-200 ${
                      location.pathname === item.path
                        ? darkMode 
                          ? 'bg-dark-300 text-primary-400' 
                          : 'bg-primary-50 text-primary-600'
                        : darkMode
                          ? 'text-gray-300 hover:bg-dark-300'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full py-3 px-4 transition-colors duration-200 ${
                    darkMode 
                      ? 'text-gray-300 hover:bg-dark-300' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiLogOut size={20} />
                  <span className="ml-3">Logout</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content area */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 mt-16 md:mt-0 transition-colors duration-200`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 