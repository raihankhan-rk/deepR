import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { researchService } from '../services/api';
import { FiSearch, FiAlertCircle, FiLoader } from 'react-icons/fi';

const Research: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const response = await researchService.startResearch(topic, additionalContext);
      
      // Redirect to the research status page
      navigate(`/research/${response.research_id}`);
    } catch (err: any) {
      console.error('Research request error:', err);
      setError(err.response?.data?.detail || 'Failed to start research. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Start New Research</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Enter your research topic and any additional context. Our AI will generate a comprehensive report for you.
        </p>
      </div>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6 flex items-start">
              <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
              Research Topic *
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input"
              placeholder="E.g. Climate change impact on ocean ecosystems"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="additional-context" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Context (Optional)
            </label>
            <textarea
              id="additional-context"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              className="input min-h-[120px]"
              placeholder="Add any specific aspects you'd like the research to focus on, particular questions, or any other context that might help."
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary py-3 px-6 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FiSearch className="mr-2" />
                  Start Research
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 card bg-primary-50 border border-primary-100">
        <h3 className="text-lg font-medium text-primary-800 mb-3">Research Tips</h3>
        <ul className="list-disc pl-5 space-y-2 text-primary-700">
          <li>Be specific with your research topic for more targeted results</li>
          <li>Use the additional context to narrow down the research scope</li>
          <li>Research can take up to 1-2 minutes to complete</li>
          <li>Results include verified sources and citations</li>
          <li>You can download the final report as a PDF</li>
        </ul>
      </div>
    </div>
  );
};

export default Research; 