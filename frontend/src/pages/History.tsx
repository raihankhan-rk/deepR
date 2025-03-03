import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch } from '@react-icons/all-files/fi/FiSearch';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import axios from 'axios';
import { API_URL } from '../config';

interface HistoryItem {
  id: string;
  topic: string;
  report: string;
  created_at: string;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setHistory(response.data);
      } catch (err: any) {
        setError('Failed to load history. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' - ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Research History</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          View and access your past research reports
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Search research history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-10">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-10 w-10 bg-gray-700 rounded-full mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        ) : error ? (
          <div className="card text-center py-8 text-red-400">
            <p>{error}</p>
            <button 
              className="btn btn-primary mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="card text-center py-12">
            {searchTerm ? (
              <>
                <h3 className="text-xl mb-2">No matching results</h3>
                <p className="text-gray-400 mb-4">Try a different search term</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <FiClock className="text-4xl text-gray-500" />
                </div>
                <h3 className="text-xl mb-2">Your research history is empty</h3>
                <p className="text-gray-400 mb-6">
                  Start your first research to build your history
                </p>
                <Link to="/research" className="btn btn-primary">
                  Start Researching
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div key={item.id} className="card hover:border-indigo-500 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                      <FiClock className="text-white" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium mb-1">{item.topic}</h3>
                    <div className="flex items-center text-sm text-gray-400">
                      <FiClock className="mr-1" />
                      <span>
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/history/${item.id}`}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History; 