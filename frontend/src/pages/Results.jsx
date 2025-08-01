import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Trash2, 
  Eye,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TestResultCard } from '../components/TestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { testsApi, handleApiError } from '../utils/api';

const Results = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTimeRange, setFilterTimeRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadTestHistory();
  }, []);

  const loadTestHistory = async () => {
    try {
      setLoading(true);
      const response = await testsApi.getHistory(100);
      setTestHistory(response.data.tests || []);
      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load test history'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewTestDetails = async (test) => {
    try {
      const response = await testsApi.getResults(test.test_id);
      setSelectedTest(response.data);
    } catch (err) {
      console.error('Error loading test details:', err);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test result?')) {
      return;
    }

    try {
      await testsApi.deleteResults(testId);
      setTestHistory(prev => prev.filter(t => t.test_id !== testId));
      if (selectedTest?.test_id === testId) {
        setSelectedTest(null);
      }
    } catch (err) {
      console.error('Error deleting test:', err);
    }
  };

  const handleExportResults = (test) => {
    const dataStr = JSON.stringify(test, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-results-${test.test_id}.json`;
    link.click();
  };

  // Filter and sort tests
  const filteredTests = testHistory
    .filter(test => {
      const matchesSearch = test.model_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           test.test_types?.some(type => type.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
      
      let matchesTimeRange = true;
      if (filterTimeRange !== 'all') {
        const testDate = new Date(test.started_at);
        const now = new Date();
        const daysDiff = (now - testDate) / (1000 * 60 * 60 * 24);
        
        switch (filterTimeRange) {
          case 'today':
            matchesTimeRange = daysDiff < 1;
            break;
          case 'week':
            matchesTimeRange = daysDiff < 7;
            break;
          case 'month':
            matchesTimeRange = daysDiff < 30;
            break;
          default:
            matchesTimeRange = true;
        }
      }
      
      return matchesSearch && matchesStatus && matchesTimeRange;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.started_at) - new Date(a.started_at);
        case 'oldest':
          return new Date(a.started_at) - new Date(b.started_at);
        case 'score':
          return (b.overall_score || 0) - (a.overall_score || 0);
        case 'model':
          return a.model_id.localeCompare(b.model_id);
        default:
          return 0;
      }
    });

  // Calculate summary statistics
  const completedTests = testHistory.filter(t => t.status === 'completed');
  const averageScore = completedTests.length > 0 
    ? completedTests.reduce((sum, t) => sum + (t.overall_score || 0), 0) / completedTests.length 
    : 0;

  // Prepare chart data
  const scoreDistributionData = [
    { range: '0-20', count: completedTests.filter(t => (t.overall_score || 0) < 20).length },
    { range: '20-40', count: completedTests.filter(t => (t.overall_score || 0) >= 20 && (t.overall_score || 0) < 40).length },
    { range: '40-60', count: completedTests.filter(t => (t.overall_score || 0) >= 40 && (t.overall_score || 0) < 60).length },
    { range: '60-80', count: completedTests.filter(t => (t.overall_score || 0) >= 60 && (t.overall_score || 0) < 80).length },
    { range: '80-100', count: completedTests.filter(t => (t.overall_score || 0) >= 80).length },
  ];

  const testTypeData = Object.entries(
    testHistory.reduce((acc, test) => {
      test.test_types?.forEach(type => {
        acc[type] = (acc[type] || 0) + 1;
      });
      return acc;
    }, {})
  ).map(([type, count]) => ({ type, count }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading test results..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
          <p className="text-gray-600 mt-1">View and analyze your model diagnostic results</p>
        </div>
        
        <button
          onClick={loadTestHistory}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{testHistory.length}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{completedTests.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{averageScore.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {testHistory.filter(t => t.status === 'running').length}
              </div>
              <div className="text-sm text-gray-600">Running</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {completedTests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Test Types */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Types Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={testTypeData}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ type, count }) => `${type}: ${count}`}
                >
                  {testTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by model or test type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-600" />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filterTimeRange}
              onChange={(e) => setFilterTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score">Highest Score</option>
              <option value="model">Model Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Test Results List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Results List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Test History ({filteredTests.length})
          </h3>
          
          {filteredTests.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTests.map((test) => (
                <div key={test.test_id} className="relative">
                  <TestResultCard
                    testResult={test}
                    onClick={() => handleViewTestDetails(test)}
                    showDetails={false}
                  />
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTestDetails(test);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-600 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {test.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportResults(test);
                        }}
                        className="p-1 text-gray-500 hover:text-green-600 rounded"
                        title="Export Results"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTest(test.test_id);
                      }}
                      className="p-1 text-gray-500 hover:text-red-600 rounded"
                      title="Delete Test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No test results found</h4>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' || filterTimeRange !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Run your first diagnostic test to see results here'
                }
              </p>
            </div>
          )}
        </div>

        {/* Test Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Details</h3>
          
          {selectedTest ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              {/* Test Overview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Test Overview</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedTest.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedTest.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedTest.status}
                  </span>
                </div>
                
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Model:</dt>
                    <dd className="font-medium text-gray-900">{selectedTest.model_id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Started:</dt>
                    <dd className="text-gray-900">
                      {new Date(selectedTest.started_at).toLocaleString()}
                    </dd>
                  </div>
                  {selectedTest.completed_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Completed:</dt>
                      <dd className="text-gray-900">
                        {new Date(selectedTest.completed_at).toLocaleString()}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Tests Run:</dt>
                    <dd className="text-gray-900">{selectedTest.test_types?.join(', ')}</dd>
                  </div>
                </dl>
              </div>

              {/* Test Scores */}
              {selectedTest.status === 'completed' && selectedTest.results && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Test Scores</h5>
                  <div className="space-y-3">
                    {Object.entries(selectedTest.results).map(([testType, result]) => (
                      <div key={testType} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 capitalize">
                            {testType.replace('_', ' ')}
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {result.score?.toFixed(1) || 
                             result.accuracy?.toFixed(1) || 
                             result.safety_score?.toFixed(1) ||
                             result.bias_score?.toFixed(1) ||
                             result.consistency_score?.toFixed(1) ||
                             'N/A'}%
                          </span>
                        </div>
                        
                        {result.detailed_results && (
                          <div className="text-xs text-gray-600">
                            <div>
                              {result.correct_answers !== undefined && `${result.correct_answers}/${result.total_questions} correct`}
                              {result.biased_responses !== undefined && `${result.biased_responses}/${result.total_prompts} biased`}
                              {result.toxic_responses !== undefined && `${result.toxic_responses}/${result.total_prompts} toxic`}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Button */}
              {selectedTest.status === 'completed' && (
                <button
                  onClick={() => handleExportResults(selectedTest)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Full Results
                </button>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <Eye className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                Select a test from the list to view detailed results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;