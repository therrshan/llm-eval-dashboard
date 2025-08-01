import React from 'react';
import { 
  TestTube, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Wifi,
  WifiOff
} from 'lucide-react';
import clsx from 'clsx';

const TestCard = ({ 
  testType,
  testInfo,
  isSelected = false,
  onToggle,
  disabled = false,
  showEstimatedTime = true,
  size = 'default'
}) => {
  const getTestIcon = (type) => {
    const icons = {
      hallucination: AlertTriangle,
      bias: TestTube,
      toxicity: XCircle,
      consistency: CheckCircle,
      performance: Play
    };
    return icons[type] || TestTube;
  };

  const getTestColor = (type) => {
    const colors = {
      hallucination: 'orange',
      bias: 'purple',
      toxicity: 'red',
      consistency: 'blue',
      performance: 'green'
    };
    return colors[type] || 'gray';
  };

  const TestIcon = getTestIcon(testType);
  const color = getTestColor(testType);
  
  const colorClasses = {
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      selected: 'bg-orange-100 border-orange-300'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200', 
      icon: 'text-purple-600',
      selected: 'bg-purple-100 border-purple-300'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600', 
      selected: 'bg-red-100 border-red-300'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      selected: 'bg-blue-100 border-blue-300'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      selected: 'bg-green-100 border-green-300'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-600',
      selected: 'bg-gray-100 border-gray-300'
    }
  };

  const currentColors = colorClasses[color];
  const isCompact = size === 'compact';

  return (
    <div
      className={clsx(
        'relative rounded-lg border-2 transition-all duration-200 cursor-pointer',
        'hover:shadow-md hover:-translate-y-0.5',
        disabled && 'opacity-50 cursor-not-allowed',
        isSelected 
          ? `${currentColors.selected} shadow-sm`
          : `${currentColors.bg} ${currentColors.border}`,
        isCompact ? 'p-3' : 'p-4'
      )}
      onClick={!disabled ? onToggle : undefined}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={clsx(
          'flex-shrink-0 p-2 rounded-lg',
          currentColors.bg,
          isCompact ? 'p-1.5' : 'p-2'
        )}>
          <TestIcon className={clsx(
            currentColors.icon,
            isCompact ? 'w-4 h-4' : 'w-5 h-5'
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={clsx(
              'font-semibold text-gray-900',
              isCompact ? 'text-sm' : 'text-base'
            )}>
              {testInfo?.name || testType}
            </h3>
            
            {/* Internet Required Indicator */}
            {testInfo?.requires_internet && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Wifi className="w-3 h-3" />
                <span>Online</span>
              </div>
            )}
          </div>

          <p className={clsx(
            'text-gray-600 mt-1',
            isCompact ? 'text-xs' : 'text-sm'
          )}>
            {testInfo?.description || `Run ${testType} diagnostic test`}
          </p>

          {/* Estimated Time */}
          {showEstimatedTime && testInfo?.estimated_time && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{testInfo.estimated_time}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar (for running tests) */}
      {disabled && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '45%' }}></div>
          </div>
          <span className="text-xs text-gray-500 mt-1">Running...</span>
        </div>
      )}
    </div>
  );
};

// Component for displaying test results
export const TestResultCard = ({ 
  testResult, 
  onClick,
  showDetails = false 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'failed':
        return XCircle;
      case 'running':
        return Play;
      case 'cancelled':
        return XCircle;
      default:
        return AlertTriangle;
    }
  };

  const StatusIcon = getStatusIcon(testResult.status);
  const statusColor = getStatusColor(testResult.status);

  return (
    <div
      className={clsx(
        'border rounded-lg p-4 cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        statusColor
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <StatusIcon className="w-5 h-5 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">{testResult.test_type}</h3>
            <p className="text-xs opacity-75 mt-1">
              {testResult.model_id} • {new Date(testResult.started_at).toLocaleString()}
            </p>
          </div>
        </div>
        
        {testResult.overall_score !== undefined && (
          <div className="text-right">
            <div className="text-lg font-bold">
              {testResult.overall_score.toFixed(1)}%
            </div>
            <div className="text-xs opacity-75">Score</div>
          </div>
        )}
      </div>

      {showDetails && testResult.status === 'completed' && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-medium">Total Tests</div>
              <div>{testResult.total_tests}</div>
            </div>
            <div>
              <div className="font-medium">Completed</div>
              <div>{testResult.completed_tests}</div>
            </div>
            <div>
              <div className="font-medium">Failed</div>
              <div>{testResult.failed_tests}</div>
            </div>
          </div>
        </div>
      )}

      {testResult.status === 'running' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{Math.round((testResult.progress || 0) * 100)}%</span>
          </div>
          <div className="w-full bg-current bg-opacity-20 rounded-full h-1">
            <div 
              className="bg-current h-1 rounded-full transition-all duration-300"
              style={{ width: `${(testResult.progress || 0) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCard;