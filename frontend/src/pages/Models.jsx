import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Download,
  AlertCircle,
  CheckCircle,
  Brain,
  Cpu,
  HardDrive,
  Zap
} from 'lucide-react';
import ModelCard from '../components/ModelCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { modelsApi, handleApiError } from '../utils/api';

const Models = ({ systemStatus, onRefreshStatus }) => {
  const [models, setModels] = useState([]);
  const [loadedModels, setLoadedModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModel, setShowAddModel] = useState(false);
  const [customModel, setCustomModel] = useState({ name: '', provider: 'huggingface_local' });

  useEffect(() => {
    loadModels();
    loadLoadedModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await modelsApi.getAvailable();
      setModels(Object.values(response.data));
      setError(null);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load available models'));
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLoadedModels = async () => {
    try {
      const response = await modelsApi.getLoaded();
      setLoadedModels(response.data);
    } catch (err) {
      console.error('Error loading loaded models:', err);
    }
  };

  const handleLoadModel = async (model) => {
    try {
      setError(null);
      const response = await modelsApi.load(model.name, model.provider, model.id);
      
      // Show success message
      console.log('Model loaded successfully:', response.data);
      
      // Refresh models and system status
      await Promise.all([
        loadModels(),
        loadLoadedModels(),
        onRefreshStatus()
      ]);
      
    } catch (err) {
      const errorMsg = handleApiError(err, 'Failed to load model');
      setError(errorMsg);
      console.error('Error loading model:', err);
    }
  };

  const handleUnloadModel = async (model) => {
    try {
      setError(null);
      const response = await modelsApi.unload(model.id);
      
      console.log('Model unloaded successfully:', response.data);
      
      // Refresh models and system status
      await Promise.all([
        loadModels(),
        loadLoadedModels(), 
        onRefreshStatus()
      ]);
      
    } catch (err) {
      const errorMsg = handleApiError(err, 'Failed to unload model');
      setError(errorMsg);
      console.error('Error unloading model:', err);
    }
  };

  const handleTestModel = async (model) => {
    // Navigate to tests page with this model pre-selected
    // For now, just show a message
    alert(`Testing functionality will be implemented in the Tests page for model: ${model.name}`);
  };

  const handleAddCustomModel = async () => {
    if (!customModel.name.trim()) {
      setError('Please enter a model name');
      return;
    }

    try {
      setError(null);
      await modelsApi.load(customModel.name, customModel.provider);
      
      // Reset form and refresh
      setCustomModel({ name: '', provider: 'huggingface_local' });
      setShowAddModel(false);
      await Promise.all([
        loadModels(),
        loadLoadedModels(),
        onRefreshStatus()
      ]);
      
    } catch (err) {
      const errorMsg = handleApiError(err, 'Failed to add custom model');
      setError(errorMsg);
    }
  };

  // Filter models based on search and filters
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = filterProvider === 'all' || model.provider === filterProvider;
    const matchesSize = filterSize === 'all' || model.size_category === filterSize;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'loaded' && model.is_loaded) ||
      (filterStatus === 'available' && !model.is_loaded);
    
    return matchesSearch && matchesProvider && matchesSize && matchesStatus;
  });

  // Get unique values for filter options
  const providers = [...new Set(models.map(m => m.provider))];
  const sizeCategories = [...new Set(models.map(m => m.size_category))];

  const getSystemMemoryInfo = () => {
    if (!systemStatus?.system?.memory) return null;
    
    const { memory } = systemStatus.system;
    return {
      total: memory.total_gb,
      available: memory.available_gb,
      used_percent: memory.used_percent
    };
  };

  const memoryInfo = getSystemMemoryInfo();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading models..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Memory Status */}
      {memoryInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">System Memory</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Available: {memoryInfo.available.toFixed(1)} GB</span>
              <span>Used: {memoryInfo.used_percent.toFixed(1)}%</span>
              <span>Device: {systemStatus.model_manager?.device || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  memoryInfo.used_percent > 90 ? 'bg-red-500' :
                  memoryInfo.used_percent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${memoryInfo.used_percent}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Management</h1>
          <p className="text-gray-600 mt-1">Load, manage, and test Large Language Models</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadModels}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowAddModel(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search models..."
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
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Providers</option>
              {providers.map(provider => (
                <option key={provider} value={provider}>
                  {provider.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sizes</option>
              {sizeCategories.map(size => (
                <option key={size} value={size}>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="loaded">Loaded</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{models.length}</div>
              <div className="text-sm text-gray-600">Available Models</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{loadedModels.length}</div>
              <div className="text-sm text-gray-600">Loaded Models</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Cpu className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{providers.length}</div>
              <div className="text-sm text-gray-600">Providers</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{filteredModels.length}</div>
              <div className="text-sm text-gray-600">Filtered Results</div>
            </div>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      {filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onLoad={handleLoadModel}
              onUnload={handleUnloadModel}
              onTest={handleTestModel}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterProvider !== 'all' || filterSize !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add your first model to get started'
            }
          </p>
          <button
            onClick={() => setShowAddModel(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Custom Model
          </button>
        </div>
      )}

      {/* Add Custom Model Modal */}
      {showAddModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Model</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., microsoft/DialoGPT-small"
                  value={customModel.name}
                  onChange={(e) => setCustomModel({...customModel, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider
                </label>
                <select
                  value={customModel.provider}
                  onChange={(e) => setCustomModel({...customModel, provider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="huggingface_local">HuggingFace Local</option>
                  <option value="huggingface_api">HuggingFace API</option>
                  <option value="ollama">Ollama</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddCustomModel}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Model
              </button>
              <button
                onClick={() => setShowAddModel(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Models;