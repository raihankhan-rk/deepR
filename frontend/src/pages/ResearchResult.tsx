import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { researchService } from '../services/api';
import { FiDownload, FiExternalLink, FiLoader, FiAlertCircle } from 'react-icons/fi';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('in_progress');
  const [activeSection, setActiveSection] = useState(0);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // First check the status
        const statusResponse = await researchService.getResearchStatus(id);
        setStatus(statusResponse.status);
        
        if (statusResponse.status === 'completed') {
          // If completed, get the report
          const reportData = await researchService.getResearchReport(id);
          setReport(reportData);
          setIsLoading(false);
        } else if (statusResponse.status === 'failed') {
          setError('Research failed. Please try again.');
          setIsLoading(false);
        } else {
          // If still in progress, poll every 5 seconds
          setTimeout(fetchData, 5000);
        }
      } catch (err: any) {
        console.error('Error fetching research:', err);
        setError(err.response?.data?.detail || 'Failed to load research. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      await researchService.downloadReportPdf(id);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };
  
  if (isLoading || status === 'in_progress') {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="card text-center py-16">
          <div className="flex flex-col items-center">
            <FiLoader className="animate-spin text-primary-600 mb-4" size={48} />
            <h2 className="text-2xl font-bold mb-2">Researching...</h2>
            <p className="text-gray-600 mb-4 max-w-md">
              We're conducting deep research on your topic. This usually takes 1-2 minutes.
            </p>
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-primary-500 rounded-full animate-pulse"></div>
            </div>
          </div>
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
          <div className="flex justify-center">
            <Link to="/research" className="btn btn-primary">
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="card text-center py-16">
          <h2 className="text-2xl font-bold mb-4">No research found</h2>
          <Link to="/research" className="btn btn-primary">
            Start New Research
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{report.topic}</h1>
          <p className="text-gray-500">
            Research completed on {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary flex items-center"
          >
            <FiDownload className="mr-2" />
            Download PDF
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Contents</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveSection(0)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    activeSection === 0
                      ? 'bg-primary-50 text-primary-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Executive Summary
                </button>
              </li>
              {report.sections.map((section, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveSection(index + 1)}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                      activeSection === index + 1
                        ? 'bg-primary-50 text-primary-600'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setActiveSection(report.sections.length + 1)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    activeSection === report.sections.length + 1
                      ? 'bg-primary-50 text-primary-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Sources
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card mb-6">
            {activeSection === 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
                <div className="prose max-w-none">
                  {report.summary.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {report.sections.map((section, index) => (
              activeSection === index + 1 && (
                <div key={index}>
                  <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                  <div className="prose max-w-none">
                    {section.content.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )
            ))}
            
            {activeSection === report.sections.length + 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Sources</h2>
                <div className="space-y-4">
                  {report.sources.map((source, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <h3 className="font-medium mb-1">{source.title}</h3>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline flex items-center text-sm mb-2"
                      >
                        {source.url} <FiExternalLink className="ml-1" size={14} />
                      </a>
                      {source.snippet && (
                        <p className="text-gray-600 text-sm">{source.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchResult; 