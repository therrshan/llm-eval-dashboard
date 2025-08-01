import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Square, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';
import TestCard from '../components/TestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { ModelListItem } from '../components/ModelCard';
import { testsApi, modelsApi, handleApiError, pollApi } from '../utils/api';

const Tests = ({ systemStatus, onRefreshStatus }) => {
  const navigate = useNavigate();
  
  // State for test configuration
  const [availableTests, setAvailableTests] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [testConfig, setTestConfig] = useState({});
  
  // State for models
  const [availableModels, setAvailableModels] = useState([]);
  const [loadedModels, setLoadedModels] = useState([]);
  
  // State for running tests
  const [runningTests, setRunningTests] = useState([]);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [testResults, setTestResults] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Poll for running test updates
    const interval = setInterval(() => {
      if (runningTests.length > 0) {
        updateRunningTests();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runningTests]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [testsResponse, modelsResponse] = await Promise.all([
        testsApi.getAvailable(),
        modelsApi.getAvailable()
      ]);
      
      setAvailableTests(testsResponse.data.tests);
      const models = Object.values(modelsResponse.data);
      setAvailableModels(models);
      setLoadedModels(models.filter(m => m.is_loaded));
      
      // Auto-select first loaded model if available
      const firstLoadedModel = models.find(m => m.is_loaded);
      if (firstLoadedModel) {
        setSelectedModel(firstLoadedModel);
      }
      
      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load test configuration'));
    } finally {
      setLoading(false);
    }
  };

  const updateRunningTests = async () => {
    const updatedTests = [];
    
    for (const testId of runningTests) {
      try {
        const response = await testsApi.getStatus(testId);
        if (response.data.status !== 'running') {
          // Test completed, remove from running tests
          if (testId === currentTestId) {
            const resultsResponse = await testsApi.getResults(testId);
            setTestResults(resultsResponse.data);
          }
        } else {
          updatedTests.push(testId);
        }
      } catch (err) {
        console.error(`Error updating test ${testId}:`, err);
      }
    }
    
    setRunningTests(updatedTests);
  };

  const handleToggleTest = (testType) => {
    setSelectedTests(prev => 
      prev.includes(testType) 
        ? prev.filter(t => t !== testType)
        : [...prev, testType]
    );
  };

  const handleRunTests = async () => {
    if (!selectedModel) {
      setError('Please select a model to test');
      return;
    }
    
    if (selectedTests.length === 0) {
      setError('Please select at least one test to run');
      return;
    }

    try {
      setError(null);
      const response = await testsApi.run(
        selectedModel.id, 
        selectedTests, 
        testConfig
      );
      
      const testId = response.data.test_id;
      setCurrentTestId(testId);
      setRunningTests(prev => [...prev, testId]);
      setTestResults(null);
      
      // Start polling for results
      pollTestResults(testId);
      
    } catch (err) {
      setError(handleApiError(err, 'Failed to start tests'));
    }
  };

  const pollTestResults = async (testId) => {
    try {
      await pollApi(
        () => testsApi.getStatus(testId),
        (data) => data.status === 'completed' || data.status === 'failed',
        2000, // Poll every 2 seconds
        150   // Max 5 minutes
      );
      
      // Get final results
      const resultsResponse = await testsApi.getResults(testId);
      setTestResults(resultsResponse.data);
      setRunningTests(prev => prev.filter(id => id !== testId));
      
    } catch (err) {
      console.error('Error polling test results:', err);
      setError('Test polling timed out. Check results page for status.');
    }
  };

  const handleCancelTest = async (testId) => {
    try {
      await testsApi.cancel(testId);
      setRunningTests(prev => prev.filter(id => id !== testId));
      if (testId === currentTestId) {
        setCurrentTestId(null);
        setTestResults(null);
      }
    } catch (err) {
      console.error('Error cancelling test:', err);
    }
  };

  const handleViewResults = () => {
    navigate('/results');
  };

  const canRunTests = selectedModel && selectedTests.length > 0 && runningTests.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading test configuration..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diagnostic Tests</h1>
          <p className="text-gray-600 mt-1">Run comprehensive evaluations on your models</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadInitialData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={handleViewResults}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            View Results
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Model</h3>
        
        {loadedModels.length > 0 ? (
          <div className="space-y-3">
            {loadedModels.map((model) => (
              <ModelListItem
                key={model.id}
                model={model}
                onSelect={setSelectedModel}
                isSelected={selectedModel?.id === model.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Models Loaded</h4>
            <p className="text-gray-600 mb-4">
              You need to load at least one model before running tests
            </p>
            <button
              onClick={() => navigate('/models')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Brain className="w-4 h-4" />
              Load Models
            </button>
          </div>
        )}
      </div>

      {/* Test Selection */}
      {loadedModels.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Tests</h3>
            <span className="text-sm text-gray-600">
              {selectedTests.length} of {Object.keys(availableTests).length} selected
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(availableTests).map(([testType, testInfo]) => (
              <TestCard
                key={testType}
                testType={testType}
                testInfo={testInfo}
                isSelected={selectedTests.includes(testType)}
                onToggle={() => handleToggleTest(testType)}
                disabled={runningTests.length > 0}
                size="default"
              />
            ))}
          </div>
        </div>
      )}

      {/* Advanced Configuration */}
      {selectedTests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Advanced Configuration</span>
          </button>
          
          {showAdvancedConfig && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Timeout (seconds)
                </label>
                <input
                  type="number"
                  min="60"
                  max="3600"
                  value={testConfig.timeout || 300}
                  onChange={(e) => setTestConfig({...testConfig, timeout: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Size
                </label>
                <select
                  value={testConfig.sample_size || 'default'}
                  onChange={(e) => setTestConfig({...testConfig, sample_size: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="small">Small (Fast)</option>
                  <option value="default">Default</option>
                  <option value="large">Large (Thorough)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Run Tests Button */}
      {selectedTests.length > 0 && selectedModel && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Ready to Run Tests</h4>
              <p className="text-sm text-gray-600 mt-1">
                {selectedTests.length} tests on {selectedModel.name}
              </p>
            </div>
            
            <button
              onClick={handleRunTests}
              disabled={!canRunTests}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                canRunTests
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {runningTests.length > 0 ? (
                <>
                  <LoadingSpinner size="sm" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Tests
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Running Tests Status */}
      {runningTests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <h4 className="font-semibold text-blue-900">Tests Running</h4>
            </div>
            
            <button
              onClick={() => handleCancelTest(currentTestId)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            >
              <Square className="w-3 h-3" />
              Cancel
            </button>
          </div>
          
          <div className="space-y-3">
            {runningTests.map((testId) => (
              <div key={testId} className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Test ID: {testId.slice(0, 8)}...</div>
                    <div className="text-sm text-gray-600">
                      Running {selectedTests.join(', ')} on {selectedModel?.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600">In Progress</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Results Preview */}
      {testResults && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Tests Completed!</h4>
            </div>
            
            <button
              onClick={handleViewResults}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              View Full Results
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-gray-900">
                {testResults.overall_score?.toFixed(1) || 'N/A'}%
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-gray-900">
                {testResults.completed_tests || 0}
              </div>
              <div className="text-sm text-gray-600">Tests Completed</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-gray-900">
                {testResults.failed_tests || 0}
              </div>
              <div className="text-sm text-gray-600">Tests Failed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;