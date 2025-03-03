import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiSearch } from '@react-icons/all-files/fi/FiSearch';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { BsArrowRight } from '@react-icons/all-files/bs/BsArrowRight';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-16">        
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Welcome to <span className="gradient-text">DeepR</span>
          {user?.username && <span>, {user.username}</span>}
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Your AI-powered research assistant. Get comprehensive reports on any topic with just a few clicks.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card hover:border-indigo-500 transition-colors">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center mb-6">
              <FiSearch className="text-white text-xl" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Start New Research</h2>
            <p className="text-gray-300 mb-6">
              Enter any topic and our AI will generate a comprehensive research report with sources.
            </p>
            <Link to="/research" className="btn btn-primary inline-flex items-center">
              Start Researching
              <BsArrowRight className="ml-2" />
            </Link>
          </div>

          <div className="card hover:border-indigo-500 transition-colors">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center mb-6">
              <FiClock className="text-white text-xl" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">View Research History</h2>
            <p className="text-gray-300 mb-6">
              Access your past research reports and continue where you left off.
            </p>
            <Link to="/history" className="btn btn-secondary inline-flex items-center">
              View History
              <BsArrowRight className="ml-2" />
            </Link>
          </div>
        </div>

        <div className="mt-16 card">
          <h2 className="text-2xl font-semibold mb-8">How It Works</h2>
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0 text-white">1</div>
              <div>
                <h3 className="font-medium text-lg mb-1">Enter Your Topic</h3>
                <p className="text-gray-300">Provide a research topic you want to explore in depth.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0 text-white">2</div>
              <div>
                <h3 className="font-medium text-lg mb-1">AI Research</h3>
                <p className="text-gray-300">Our advanced AI conducts comprehensive research using Google Gemini.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0 text-white">3</div>
              <div>
                <h3 className="font-medium text-lg mb-1">Review Report</h3>
                <p className="text-gray-300">Receive a structured report with citations and sources.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0 text-white">4</div>
              <div>
                <h3 className="font-medium text-lg mb-1">Download & Share</h3>
                <p className="text-gray-300">Download your report as a PDF for easy sharing and reference.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;