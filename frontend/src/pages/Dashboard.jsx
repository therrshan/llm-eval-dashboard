import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  TestTube, 
  BarChart3, 
  Zap,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
  Cpu,
  HardDrive,
  Play,
  Plus
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { modelsApi, testsApi, handleApiError } from '../utils/api';

const Dashboard = ({ systemStatus, onRefreshStatus }) => {
  const navigate = useNavigate();
  const [recentTests, setRecentTests] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    loadRecentTests();
    loadAvailableModels();
  }, []);

  const loadRecentTests = async () => {
    try {
      const response = await testsApi.getHistory(5);
      setRecentTests(response.data.tests || []);
    } catch (err) {
      console.error('Error loading recent tests:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const response = await modelsApi.getAvailable();
      setAvailableModels(Object.values(response.data));
    } catch (err) {
      console.error('Error loading models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const getSystemHealthStatus = () => {
    if (!systemStatus?.system) return { status: 'unknown', color: 'gray' };
    
    const { memory, cpu_percent } = systemStatus.system;
    const memoryPercent = memory?.used_percent || 0;
    
    if (memoryPercent > 90 || cpu_percent > 90) {
      return { status: 'critical', color: 'red' };
    } else if (memoryPercent > 70 || cpu_percent > 70) {
      return { status: 'warning', color: 'yellow' };
    } else {
      return { status: 'healthy', color: 'green' };
    }
  };

  const health = getSystemHealthStatus();
  const loadedModelsCount = availableModels.filter(m => m.is_loaded).length;
  const runningTestsCount = recentTests.filter(t => t.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to LLM Diagnostic Dashboard</h1>
        <p className="text-blue-100">
          Comprehensive testing and analysis tools for Large Language Models
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className={`text-2xl font-bold capitalize ${
                health.color === 'green' ? 'text-green-600' :
                health.color === 'yellow' ? 'text-yellow-600' :
                health.color === 'red' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {health.status}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              health.color === 'green' ? 'bg-green-100' :
              health.color === 'yellow' ? 'bg-yellow-100' :
              health.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <Activity className={`w-6 h-6 ${
                health.color === 'green' ? 'text-green-600' :
                health.color === 'yellow' ? 'text-yellow-600' :
                health.color === 'red' ? 'text-red-600' : 'text-gray-600'
              }`} />
            </div>
          </div>
        </div>

        {/* Loaded Models */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Loaded Models</p>
              <p className="text-2xl font-bold text-gray-900">{loadedModelsCount}</p>
              <p className="text-xs text-gray-500">of {availableModels.length} available</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Running Tests */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Running Tests</p>
              <p className="text-2xl font-bold text-gray-900">{runningTestsCount}</p>
              <p className="text-xs text-gray-500">active diagnostics</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TestTube className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Total Tests */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">{recentTests.length}</p>
              <p className="text-xs text-gray-500">completed recently</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      {systemStatus && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CPU Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {systemStatus.system?.cpu_percent?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (systemStatus.system?.cpu_percent || 0) > 80 ? 'bg-red-500' :
                    (systemStatus.system?.cpu_percent || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemStatus.system?.cpu_percent || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {systemStatus.system?.memory?.used_percent?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (systemStatus.system?.memory?.used_percent || 0) > 80 ? 'bg-red-500' :
                    (systemStatus.system?.memory?.used_percent || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemStatus.system?.memory?.used_percent || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Device Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Compute Device</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>{systemStatus.model_manager?.device?.toUpperCase() || 'Unknown'}</div>
                {systemStatus.system?.gpu?.available && (
                  <div className="text-xs text-green-600 mt-1">
                    GPU: {systemStatus.system.gpu.device_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions Panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/models')}
              className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Manage Models</div>
                <div className="text-sm text-gray-600">Load, unload, and configure LLM models</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/tests')}
              className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <TestTube className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Run Diagnostics</div>
                <div className="text-sm text-gray-600">Test models for bias, toxicity, and performance</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/results')}
              className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">View Results</div>
                <div className="text-sm text-gray-600">Analyze test results and model comparisons</div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tests</h3>
            <button
              onClick={() => navigate('/results')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>

          {loadingTests ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" text="Loading tests..." />
            </div>
          ) : recentTests.length > 0 ? (
            <div className="space-y-3">
              {recentTests.slice(0, 5).map((test) => (
                <div key={test.test_id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    test.status === 'completed' ? 'bg-green-100' :
                    test.status === 'running' ? 'bg-blue-100' :
                    test.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {test.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : test.status === 'running' ? (
                      <Play className="w-4 h-4 text-blue-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {test.test_types?.join(', ') || 'Unknown Test'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        test.status === 'completed' ? 'bg-green-100 text-green-800' :
                        test.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        test.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{test.model_id}</span>
                      <span>•</span>
                      <span>{new Date(test.started_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {test.overall_score !== undefined && (
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {test.overall_score.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TestTube className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">No recent tests found</p>
              <button
                onClick={() => navigate('/tests')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Run Your First Test
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Tips (show if no models loaded) */}
      {loadedModelsCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
              <p className="text-blue-800 mb-4">
                Welcome! To start using the LLM Diagnostic Dashboard, follow these steps:
              </p>
              <ol className="list-decimal list-inside text-blue-800 space-y-2 mb-4">
                <li>Load your first model in the Models section</li>
                <li>Run diagnostic tests to evaluate the model</li>
                <li>Review results and compare model performance</li>
              </ol>
              <button
                onClick={() => navigate('/models')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Brain className="w-4 h-4" />
                Load Your First Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;