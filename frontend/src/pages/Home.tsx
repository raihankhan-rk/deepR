import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiSearch } from '@react-icons/all-files/fi/FiSearch';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { BsArrowRight } from '@react-icons/all-files/bs/BsArrowRight';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Welcome to <span className="gradient-text">DeepR</span>, {user?.username}!
        </h1>
        <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
          Your AI-powered research assistant. Get comprehensive reports on any topic with just a few clicks.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className={`card hover:shadow-lg transition-all duration-200 ${darkMode ? 'hover:bg-dark-300' : 'hover:bg-gray-50'}`}>
            <div className={`w-12 h-12 rounded-full ${darkMode ? 'bg-primary-800' : 'bg-primary-100'} flex items-center justify-center mb-6`}>
              <FiSearch className={`${darkMode ? 'text-primary-300' : 'text-primary-600'} text-xl`} />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Start New Research</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Enter any topic and our AI will generate a comprehensive research report with sources.
            </p>
            <Link to="/research" className="btn btn-primary inline-flex items-center">
              Start Researching
              <BsArrowRight className="ml-2" />
            </Link>
          </div>

          <div className={`card hover:shadow-lg transition-all duration-200 ${darkMode ? 'hover:bg-dark-300' : 'hover:bg-gray-50'}`}>
            <div className={`w-12 h-12 rounded-full ${darkMode ? 'bg-secondary-800' : 'bg-secondary-100'} flex items-center justify-center mb-6`}>
              <FiClock className={`${darkMode ? 'text-secondary-300' : 'text-secondary-600'} text-xl`} />
            </div>
            <h2 className="text-2xl font-semibold mb-4">View Research History</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Access your past research reports and continue where you left off.
            </p>
            <Link to="/history" className="btn btn-secondary inline-flex items-center">
              View History
              <BsArrowRight className="ml-2" />
            </Link>
          </div>
        </div>

        <div className={`mt-16 card ${darkMode ? 'bg-dark-200/50' : 'bg-white'} animated-bg`}>
          <h2 className="text-2xl font-semibold mb-8">How It Works</h2>
          <div className="space-y-8">
            <div className="flex items-start">
              <div className={`${darkMode ? 'bg-dark-300 text-primary-400' : 'bg-primary-100 text-primary-600'} w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0`}>1</div>
              <div>
                <h3 className="font-medium text-lg mb-1">Enter Your Topic</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Provide a research topic you want to explore in depth.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className={`${darkMode ? 'bg-dark-300 text-primary-400' : 'bg-primary-100 text-primary-600'} w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0`}>2</div>
              <div>
                <h3 className="font-medium text-lg mb-1">AI Research</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Our advanced AI conducts comprehensive research using Google Gemini.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className={`${darkMode ? 'bg-dark-300 text-primary-400' : 'bg-primary-100 text-primary-600'} w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0`}>3</div>
              <div>
                <h3 className="font-medium text-lg mb-1">Review Report</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Receive a structured report with citations and sources.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className={`${darkMode ? 'bg-dark-300 text-primary-400' : 'bg-primary-100 text-primary-600'} w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0`}>4</div>
              <div>
                <h3 className="font-medium text-lg mb-1">Download & Share</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Download your report as a PDF for easy sharing and reference.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;