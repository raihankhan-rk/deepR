import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiSearch } from 'react-icons/fi';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Welcome to DeepR, {user?.username}!
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your AI-powered research assistant. Get comprehensive reports on any topic with just a few clicks.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Start New Research</h2>
            <p className="text-gray-600 mb-6">
              Enter any topic and our AI will generate a comprehensive research report with sources.
            </p>
            <Link to="/research" className="btn btn-primary inline-flex items-center">
              <FiSearch className="mr-2" />
              Start Researching
            </Link>
          </div>

          <div className="card hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">View Research History</h2>
            <p className="text-gray-600 mb-6">
              Access your past research reports and continue where you left off.
            </p>
            <Link to="/history" className="btn btn-secondary inline-flex items-center">
              View History
            </Link>
          </div>
        </div>

        <div className="mt-12 card">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0">1</div>
              <div>
                <h3 className="font-medium">Enter Your Topic</h3>
                <p className="text-gray-600">Provide a research topic and any additional context.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0">2</div>
              <div>
                <h3 className="font-medium">AI Research</h3>
                <p className="text-gray-600">Our advanced AI conducts comprehensive research using Google Gemini.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0">3</div>
              <div>
                <h3 className="font-medium">Review Report</h3>
                <p className="text-gray-600">Receive a structured report with citations and sources.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-4 flex-shrink-0">4</div>
              <div>
                <h3 className="font-medium">Download & Share</h3>
                <p className="text-gray-600">Download your report as a PDF for easy sharing and reference.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 