import React, { useState } from 'react';
import { BiSearch } from '@react-icons/all-files/bi/BiSearch';
import { FaSpinner } from '@react-icons/all-files/fa/FaSpinner';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const Research: React.FC = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setReport('');

    try {
      const response = await axios.post(`${API_URL}/api/research`, { topic }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setReport(response.data.report);
      // Save to history
      if (user) {
        await axios.post(
          `${API_URL}/api/history`,
          { topic, report: response.data.report },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate research report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Research Assistant</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Enter any topic below and our AI will generate a comprehensive research report with citations.
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="card mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a research topic..."
                className="bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="btn btn-primary flex-shrink-0"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Researching...
                </>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </form>

        {error && <div className="p-4 mb-6 bg-red-900/50 border border-red-700 rounded-lg text-red-200">{error}</div>}

        {report && (
          <div className="card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Research Report: {topic}</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>
        )}

        {!report && !loading && (
          <div className="card text-center py-16">
            <h3 className="text-xl mb-3 font-medium">Enter a topic to get started</h3>
            <p className="text-gray-400">
              Try topics like "Quantum Computing", "Climate Change Solutions", or "Artificial Intelligence Ethics"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Research; 