import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import researchService from '../services/researchService';
import { FiDownload, FiExternalLink, FiLoader, FiAlertCircle } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import './ResearchResult.css';
import { useTheme } from '../contexts/ThemeContext';

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
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const { darkMode } = useTheme();
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // First check the status
        const statusResponse = await researchService.getResearchStatus(id);
        setStatus(statusResponse.status);
        
        if (statusResponse.status === 'completed') {
          // If completed, get the report
          const reportData = await researchService.getResearchResult(id);
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
    
    setIsPdfLoading(true);
    setPdfError(null);
    
    try {
      const blob = await researchService.downloadPdf(id);
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `Research_Report_${id}.pdf`;
      // Trigger download
      document.body.appendChild(link);
      link.click();
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      setPdfError(err.message || 'Failed to download PDF. Please try again later.');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setPdfError(null);
      }, 5000);
    } finally {
      setIsPdfLoading(false);
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
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Research completed on {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleDownloadPdf}
            disabled={isPdfLoading}
            className={`btn btn-primary flex items-center ${isPdfLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isPdfLoading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Downloading...
              </>
            ) : (
              <>
                <FiDownload className="mr-2" />
                Download Report
              </>
            )}
          </button>
          {pdfError && (
            <div className="text-red-500 text-sm mt-2">
              {pdfError}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Sections</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveSection(0)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    activeSection === 0
                      ? `${darkMode ? 'bg-primary-900/30 text-primary-400' : 'bg-primary-50 text-primary-600'}`
                      : `${darkMode ? 'hover:bg-dark-300' : 'hover:bg-gray-100'}`
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
                        ? `${darkMode ? 'bg-primary-900/30 text-primary-400' : 'bg-primary-50 text-primary-600'}`
                        : `${darkMode ? 'hover:bg-dark-300' : 'hover:bg-gray-100'}`
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
                      ? `${darkMode ? 'bg-primary-900/30 text-primary-400' : 'bg-primary-50 text-primary-600'}`
                      : `${darkMode ? 'hover:bg-dark-300' : 'hover:bg-gray-100'}`
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
                <div className={`prose ${darkMode ? 'dark:prose-invert' : ''} prose-lg max-w-none markdown-content`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    className="research-markdown"
                    components={{
                      h1: ({node, children, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props}>{children}</h1>,
                      h2: ({node, children, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3" {...props}>{children}</h2>,
                      h3: ({node, children, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props}>{children}</h3>,
                      p: ({node, children, ...props}) => <p className="mb-4 whitespace-pre-line" {...props}>{children}</p>,
                      ul: ({node, children, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>{children}</ul>,
                      ol: ({node, children, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>{children}</ol>,
                      li: ({node, children, ...props}) => <li className="mb-1" {...props}>{children}</li>,
                      blockquote: ({node, children, ...props}) => <blockquote className={`border-l-4 ${darkMode ? 'border-gray-700' : 'border-gray-300'} pl-4 italic my-4`} {...props}>{children}</blockquote>,
                      table: ({node, children, ...props}) => <div className="overflow-x-auto my-4"><table className={`min-w-full border-collapse border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} {...props}>{children}</table></div>,
                      thead: ({node, children, ...props}) => <thead className={darkMode ? 'bg-dark-300' : 'bg-gray-100'} {...props}>{children}</thead>,
                      tbody: ({node, children, ...props}) => <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-300'}`} {...props}>{children}</tbody>,
                      tr: ({node, children, ...props}) => <tr className={darkMode ? 'hover:bg-dark-300' : 'hover:bg-gray-50'} {...props}>{children}</tr>,
                      th: ({node, children, ...props}) => <th className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} px-4 py-2 text-left font-semibold`} {...props}>{children}</th>,
                      td: ({node, children, ...props}) => <td className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} px-4 py-2`} {...props}>{children}</td>,
                      pre: ({node, children, ...props}) => <pre className={`${darkMode ? 'bg-dark-300' : 'bg-gray-100'} p-4 rounded overflow-x-auto my-4 whitespace-pre-wrap`} {...props}>{children}</pre>,
                      code: ({node, className, children, ...props}: any) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return className && match ? (
                          <code className={`${className} block p-4 rounded overflow-x-auto`} {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className={`${darkMode ? 'bg-dark-300 text-gray-200' : 'bg-gray-100 text-gray-800'} px-1 py-0.5 rounded text-sm`} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {report.summary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            {report.sections.map((section, index) => (
              activeSection === index + 1 && (
                <div key={index}>
                  <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                  <div className="prose prose-lg max-w-none markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      className="research-markdown"
                      components={{
                        h1: ({node, children, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props}>{children}</h1>,
                        h2: ({node, children, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3" {...props}>{children}</h2>,
                        h3: ({node, children, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props}>{children}</h3>,
                        p: ({node, children, ...props}) => <p className="mb-4 whitespace-pre-line" {...props}>{children}</p>,
                        ul: ({node, children, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>{children}</ul>,
                        ol: ({node, children, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>{children}</ol>,
                        li: ({node, children, ...props}) => <li className="mb-1" {...props}>{children}</li>,
                        blockquote: ({node, children, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props}>{children}</blockquote>,
                        table: ({node, children, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-gray-300" {...props}>{children}</table></div>,
                        thead: ({node, children, ...props}) => <thead className="bg-gray-100" {...props}>{children}</thead>,
                        tbody: ({node, children, ...props}) => <tbody className="divide-y divide-gray-300" {...props}>{children}</tbody>,
                        tr: ({node, children, ...props}) => <tr className="hover:bg-gray-50" {...props}>{children}</tr>,
                        th: ({node, children, ...props}) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold" {...props}>{children}</th>,
                        td: ({node, children, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props}>{children}</td>,
                        pre: ({node, children, ...props}) => <pre className="bg-gray-100 p-4 rounded overflow-x-auto my-4 whitespace-pre-wrap" {...props}>{children}</pre>,
                        code: ({node, className, children, ...props}: any) => {
                          const match = /language-(\w+)/.exec(className || '')
                          return className && match ? (
                            <code className={`${className} block p-4 rounded overflow-x-auto`} {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )
            ))}
            
            {activeSection === report.sections.length + 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Sources</h2>
                <div className="space-y-4">
                  {report.sources.map((source, index) => (
                    <div key={index} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} pb-4 last:border-0`}>
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
                        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm prose prose-sm max-w-none`}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            className="research-markdown"
                          >
                            {source.snippet}
                          </ReactMarkdown>
                        </div>
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