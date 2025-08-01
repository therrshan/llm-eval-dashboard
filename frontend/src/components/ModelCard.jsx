import React, { useState } from 'react';
import { 
  Brain, 
  Download, 
  Trash2, 
  Play,
  Pause,
  HardDrive,
  Cpu,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import clsx from 'clsx';
import LoadingSpinner from './LoadingSpinner';

const ModelCard = ({ 
  model,
  onLoad,
  onUnload,
  onTest,
  isLoading = false,
  showActions = true,
  size = 'default'
}) => {
  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (action, ...args) => {
    setActionLoading(action);
    try {
      await action(...args);
    } finally {
      setActionLoading(null);
    }
  };

  const getSizeInfo = (sizeCategory) => {
    const sizeMap = {
      tiny: { label: 'Tiny', color: 'green', memory: '< 2GB' },
      small: { label: 'Small', color: 'blue', memory: '2-4GB' },
      medium: { label: 'Medium', color: 'yellow', memory: '4-8GB' },
      large: { label: 'Large', color: 'orange', memory: '8-16GB' },
      xlarge: { label: 'X-Large', color: 'red', memory: '16GB+' },
      api: { label: 'API', color: 'purple', memory: 'Cloud' },
      unknown: { label: 'Unknown', color: 'gray', memory: '?GB' }
    };
    return sizeMap[sizeCategory] || sizeMap.unknown;
  };

  const getTypeIcon = (type) => {
    const icons = {
      chat: Brain,
      code: Cpu,
      general: Brain,
      embedding: Zap
    };
    return icons[type] || Brain;
  };

  const sizeInfo = getSizeInfo(model.size_category);
  const TypeIcon = getTypeIcon(model.type);
  const isCompact = size === 'compact';

  const sizeColors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className={clsx(
      'bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200',
      'hover:shadow-md hover:border-gray-300',
      isCompact ? 'p-3' : 'p-4'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={clsx(
            'flex-shrink-0 p-2 bg-gradient-to-br rounded-lg',
            model.is_loaded 
              ? 'from-green-400 to-green-600' 
              : 'from-gray-400 to-gray-600'
          )}>
            <TypeIcon className="w-5 h-5 text-white" />
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className={clsx(
              'font-semibold text-gray-900 truncate',
              isCompact ? 'text-sm' : 'text-base'
            )}>
              {model.name.split('/').pop() || model.name}
            </h3>
            <p className={clsx(
              'text-gray-500 truncate',
              isCompact ? 'text-xs' : 'text-sm'
            )}>
              {model.name}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {model.is_loaded ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Loaded</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              <Circle className="w-4 h-4" />
              <span className="text-xs font-medium">Available</span>
            </div>
          )}
        </div>
      </div>

      {/* Model Info */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Size Badge */}
        <span className={clsx(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
          sizeColors[sizeInfo.color]
        )}>
          <HardDrive className="w-3 h-3 mr-1" />
          {sizeInfo.label}
        </span>

        {/* Provider Badge */}
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          {model.provider.replace('_', ' ')}
        </span>

        {/* Type Badge */}
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          {model.type}
        </span>
      </div>

      {/* Memory Usage */}
      {model.is_loaded && model.memory_usage_mb && (
        <div className="mb-3 p-2 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Memory Usage</span>
            <span className="font-medium">
              {(model.memory_usage_mb / 1024).toFixed(1)} GB
            </span>
          </div>
        </div>
      )}

      {/* Estimated Memory */}
      {!model.is_loaded && model.estimated_memory_gb && (
        <div className="mb-3 p-2 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Estimated Memory</span>
            <span className="font-medium">{model.estimated_memory_gb} GB</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {model.error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">{model.error}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {!model.is_loaded ? (
            <button
              onClick={() => handleAction(onLoad, model)}
              disabled={isLoading || actionLoading === onLoad}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200'
              )}
            >
              {actionLoading === onLoad ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Load Model
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAction(onTest, model)}
                disabled={isLoading || actionLoading}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                  'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-200'
                )}
              >
                {actionLoading === onTest ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Test
              </button>
              
              <button
                onClick={() => handleAction(onUnload, model)}
                disabled={isLoading || actionLoading === onUnload}
                className={clsx(
                  'px-3 py-2 rounded-md text-sm font-medium border border-gray-300',
                  'text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-200'
                )}
              >
                {actionLoading === onUnload ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <LoadingSpinner text="Loading..." />
        </div>
      )}
    </div>
  );
};

// Simple Circle component since it's not in lucide-react
const Circle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

// Compact version for lists
export const ModelListItem = ({ model, onSelect, isSelected = false }) => {
  return (
    <div
      className={clsx(
        'flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200',
        isSelected 
          ? 'border-blue-300 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
      onClick={() => onSelect(model)}
    >
      <div className="flex items-center gap-3">
        <div className={clsx(
          'w-8 h-8 rounded-md flex items-center justify-center',
          model.is_loaded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
        )}>
          <Brain className="w-4 h-4" />
        </div>
        
        <div>
          <div className="font-medium text-sm text-gray-900">
            {model.name.split('/').pop() || model.name}
          </div>
          <div className="text-xs text-gray-500">
            {model.provider} • {getSizeInfo(model.size_category).label}
          </div>
        </div>
      </div>

      {model.is_loaded && (
        <CheckCircle className="w-5 h-5 text-green-600" />
      )}
    </div>
  );
};

// Helper function (duplicated from main component for export)
const getSizeInfo = (sizeCategory) => {
  const sizeMap = {
    tiny: { label: 'Tiny', color: 'green', memory: '< 2GB' },
    small: { label: 'Small', color: 'blue', memory: '2-4GB' },
    medium: { label: 'Medium', color: 'yellow', memory: '4-8GB' },
    large: { label: 'Large', color: 'orange', memory: '8-16GB' },
    xlarge: { label: 'X-Large', color: 'red', memory: '16GB+' },
    api: { label: 'API', color: 'purple', memory: 'Cloud' },
    unknown: { label: 'Unknown', color: 'gray', memory: '?GB' }
  };
  return sizeMap[sizeCategory] || sizeMap.unknown;
};

export default ModelCard;