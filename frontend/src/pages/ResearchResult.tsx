import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../config';

// Define interfaces for our data
interface Source {
  title: string;
  url: string;
  snippet?: string;
}

interface Section {
  title: string;
  content: string;
}

interface Report {
  id: string;
  topic: string;
  summary: string;
  sections: Section[];
  sources: Source[];
  created_at: string;
}

const ResearchResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/research/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const reportData = response.data;
      setReport(reportData);
      
      // Initialize expanded sections
      const sectionsState: { [key: string]: boolean } = {};
      reportData.sections.forEach((section: Section) => {
        sectionsState[section.title] = false;
      });
      setExpandedSections(sectionsState);
      
    } catch (err: any) {
      console.error('Error fetching research:', err);
      setError(err.response?.data?.message || 'Failed to load research report.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' - ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center py-10">
          <div className="text-red-400 text-xl mb-4">{error || 'Report not found'}</div>
          <button 
            onClick={() => window.history.back()} 
            className="btn btn-primary mt-4"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{report.topic}</h1>
              <p className="text-sm text-gray-400">
                {formatDate(report.created_at)}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">Summary</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <ReactMarkdown className="prose prose-invert max-w-none">
                {report.summary}
              </ReactMarkdown>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-medium mb-4">Sections</h2>
            <div className="space-y-4">
              {report.sections.map((section, index) => (
                <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    className="flex justify-between items-center w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors duration-200 text-left"
                    onClick={() => toggleSection(section.title)}
                  >
                    <h3 className="text-lg font-medium">{section.title}</h3>
                    <div className="text-gray-400">
                      {expandedSections[section.title] ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  
                  {expandedSections[section.title] && (
                    <div className="px-4 py-3 bg-gray-800/50">
                      <ReactMarkdown className="prose prose-invert max-w-none prose-p:text-gray-300">
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-medium mb-4">Sources</h2>
            <div className="space-y-4">
              {report.sources.map((source, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4">
                  <div className="mb-2">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {source.title}
                    </a>
                  </div>
                  {source.snippet && (
                    <div className="text-sm text-gray-400">
                      <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                        {source.snippet}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchResult; 