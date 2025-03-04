import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import researchService from '../services/researchService';
import { FiSearch, FiClock, FiArrowRight, FiLoader, FiAlertCircle } from 'react-icons/fi';

interface ResearchItem {
  id: string;
  user_id: number;
  topic: string;
  created_at: string;
}

const History: React.FC = () => {
  const [researches, setResearches] = useState<ResearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await researchService.getResearchHistory();
        setResearches(response.researches);
        setIsLoading(false);
      } catch (err: any) {
        // Detailed error logging
        let errorMessage = 'Failed to load research history.';
        let debugDetails = '';
        
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = err.response.data?.detail || errorMessage;
          debugDetails = `Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`;
        } else if (err.request) {
          // The request was made but no response was received
          debugDetails = 'No response received from server';
        } else {
          // Something happened in setting up the request that triggered an Error
          debugDetails = err.message || 'Unknown error';
        }
        
        setError(errorMessage);
        setDebugInfo(debugDetails);
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, []);
  
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <FiLoader className="animate-spin text-primary-600" size={36} />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="card">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <FiAlertCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">Error</h2>
          <p className="text-center text-gray-700 mb-6">{error}</p>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto">
              <p className="text-xs font-mono">{debugInfo}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (researches.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Research History</h1>
          <p className="text-gray-600">Track and access your past research</p>
        </div>
        
        <div className="card text-center py-16">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-4 rounded-full">
              <FiClock className="text-gray-400" size={48} />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">No Research History</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You haven't conducted any research yet. Start your first research to see it here.
          </p>
          <Link to="/research" className="btn btn-primary inline-flex items-center">
            <FiSearch className="mr-2" />
            Start New Research
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Research History</h1>
          <p className="text-gray-600">Track and access your past research</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link to="/research" className="btn btn-primary inline-flex items-center">
            <FiSearch className="mr-2" />
            New Research
          </Link>
        </div>
      </div>
      
      <div className="card">
        <div className="divide-y divide-gray-200">
          {researches.map((research) => (
            <div key={research.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{research.topic}</h3>
                  <p className="text-gray-500 text-sm flex items-center">
                    <FiClock className="mr-2" size={14} />
                    {new Date(research.created_at).toLocaleDateString()} at{' '}
                    {new Date(research.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <Link
                  to={`/research/${research.id}`}
                  className="btn btn-secondary inline-flex items-center"
                >
                  View Report <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default History; 