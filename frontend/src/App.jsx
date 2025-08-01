import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import Tests from './pages/Tests';
import Results from './pages/Results';
import LoadingSpinner from './components/LoadingSpinner';

// Utils
import { apiClient } from './utils/api';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkApiConnection();
    // Check system status every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApiConnection = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/health');
      console.log('API connection successful:', response.data);
      await checkSystemStatus();
      setError(null);
    } catch (err) {
      console.error('API connection failed:', err);
      setError('Cannot connect to backend server. Please ensure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const response = await apiClient.get('/api/models/system/status');
      setSystemStatus(response.data);
    } catch (err) {
      console.error('Failed to get system status:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Connecting to LLM Diagnostic Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Connection Error</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={checkApiConnection}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage}
            systemStatus={systemStatus}
          />
          
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              currentPage={currentPage}
              systemStatus={systemStatus}
              onRefreshStatus={checkSystemStatus}
            />
            
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
              <div className="container mx-auto px-6 py-8">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <Dashboard 
                        systemStatus={systemStatus}
                        onRefreshStatus={checkSystemStatus}
                      />
                    } 
                  />
                  <Route 
                    path="/models" 
                    element={
                      <Models 
                        systemStatus={systemStatus}
                        onRefreshStatus={checkSystemStatus}
                      />
                    } 
                  />
                  <Route 
                    path="/tests" 
                    element={
                      <Tests 
                        systemStatus={systemStatus}
                        onRefreshStatus={checkSystemStatus}
                      />
                    } 
                  />
                  <Route 
                    path="/results" 
                    element={<Results />} 
                  />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;