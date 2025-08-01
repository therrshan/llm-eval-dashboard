import axios from 'axios';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle common errors
    if (error.response?.status === 404) {
      console.warn('Resource not found');
    } else if (error.response?.status === 500) {
      console.error('Server error');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to server');
    }
    
    return Promise.reject(error);
  }
);

// API functions for models
export const modelsApi = {
  // Get all available models
  getAvailable: () => apiClient.get('/api/models/available'),
  
  // Get loaded models
  getLoaded: () => apiClient.get('/api/models/loaded'),
  
  // Load a model
  load: (modelName, provider = 'huggingface_local', modelId = null) =>
    apiClient.post('/api/models/load', {
      model_name: modelName,
      provider,
      model_id: modelId,
    }),
  
  // Unload a model
  unload: (modelId) => apiClient.post(`/api/models/unload/${modelId}`),
  
  // Generate text
  generate: (modelId, prompt, options = {}) =>
    apiClient.post('/api/models/generate', {
      model_id: modelId,
      prompt,
      ...options,
    }),
  
  // Get model info
  getInfo: (modelId) => apiClient.get(`/api/models/info/${modelId}`),
  
  // Get system status
  getSystemStatus: () => apiClient.get('/api/models/system/status'),
};

// API functions for tests
export const testsApi = {
  // Get available tests
  getAvailable: () => apiClient.get('/api/tests/available'),
  
  // Run tests
  run: (modelId, testTypes, testConfig = {}) =>
    apiClient.post('/api/tests/run', {
      model_id: modelId,
      test_types: testTypes,
      test_config: testConfig,
    }),
  
  // Get test status
  getStatus: (testId) => apiClient.get(`/api/tests/status/${testId}`),
  
  // Get test results
  getResults: (testId) => apiClient.get(`/api/tests/results/${testId}`),
  
  // Get test history
  getHistory: (limit = 50) => apiClient.get(`/api/tests/history?limit=${limit}`),
  
  // Cancel test
  cancel: (testId) => apiClient.delete(`/api/tests/cancel/${testId}`),
  
  // Delete test results
  deleteResults: (testId) => apiClient.delete(`/api/tests/results/${testId}`),
};

// Generic API functions
export const api = {
  // Health check
  health: () => apiClient.get('/api/health'),
  
  // Root endpoint
  root: () => apiClient.get('/'),
};

// Helper functions for error handling
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  } else if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return defaultMessage;
  }
};

// Helper function to format API responses
export const formatApiResponse = (response) => {
  return {
    data: response.data,
    status: response.status,
    success: response.status >= 200 && response.status < 300,
  };
};

// Helper function for polling (useful for test status)
export const pollApi = async (apiCall, condition, interval = 2000, maxAttempts = 150) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await apiCall();
      if (condition(response.data)) {
        return response;
      }
    } catch (error) {
      console.error('Polling error:', error);
      throw error;
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Polling timeout: Maximum attempts reached');
};

// Export default client
export default apiClient;