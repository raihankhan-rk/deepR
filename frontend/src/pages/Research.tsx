import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import researchService from '../services/researchService';
import { FiSearch, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

const Research: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('Please enter a research topic');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await researchService.startResearch(topic);
      
      // Redirect to the research status page
      navigate(`/research/${response.research_id}`);
    } catch (err: any) {
      console.error('Research request error:', err);
      setError(err.response?.data?.detail || 'Failed to start research. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="gradient-text">Deep Research</span>
        </h1>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto text-lg`}>
          Enter your research topic and our AI will generate a comprehensive, academic-quality report with sources.
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="mb-8">
          {error && (
            <div className={`${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-500'} border-l-4 p-4 rounded-lg mb-6 flex items-start`}>
              <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
            </div>
          )}
          
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="search-input pr-14"
              placeholder="What do you want to know?"
              disabled={isSubmitting}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200 disabled:opacity-70"
              aria-label="Start Research"
            >
              {isSubmitting ? (
                <FiLoader className="animate-spin" size={20} />
              ) : (
                <FiSearch size={20} />
              )}
            </button>
          </div>
        </form>
        
        <div className={`rounded-2xl p-6 ${darkMode ? 'bg-dark-200' : 'bg-white'} shadow-custom animated-bg`}>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-primary-400' : 'text-primary-800'} mb-4`}>What can you research?</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-300' : 'bg-gray-50'}`}>
              <h4 className="font-medium mb-2">Academic Topics</h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                "The impact of climate change on ocean ecosystems"
              </p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-300' : 'bg-gray-50'}`}>
              <h4 className="font-medium mb-2">Historical Events</h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                "The economic consequences of the Industrial Revolution"
              </p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-300' : 'bg-gray-50'}`}>
              <h4 className="font-medium mb-2">Technology Trends</h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                "The evolution and future of artificial intelligence"
              </p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-300' : 'bg-gray-50'}`}>
              <h4 className="font-medium mb-2">Health & Medicine</h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                "Advances in cancer treatment over the last decade"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Research; 