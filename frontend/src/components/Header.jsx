import React, { useState } from 'react';
import { 
  RefreshCw, 
  Activity, 
  AlertCircle, 
  CheckCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import clsx from 'clsx';

const Header = ({ systemStatus, onRefreshStatus }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const getPageTitle = () => {
    const path = window.location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/models':
        return 'Model Management';
      case '/tests':
        return 'Diagnostic Tests';
      case '/results':
        return 'Test Results';
      default:
        return 'LLM Diagnostic Dashboard';
    }
  };

  const getSystemHealth = () => {
    if (!systemStatus) {
      return { status: 'unknown', color: 'gray', icon: AlertCircle };
    }

    const { system, model_manager } = systemStatus;
    
    // Check various health indicators
    const memoryUsage = system?.memory?.used_percent || 0;
    const cpuUsage = system?.cpu_percent || 0;
    const hasLoadedModels = (model_manager?.loaded_count || 0) > 0;

    if (memoryUsage > 90 || cpuUsage > 90) {
      return { status: 'critical', color: 'red', icon: AlertCircle };
    } else if (memoryUsage > 70 || cpuUsage > 70) {
      return { status: 'warning', color: 'yellow', icon: AlertCircle };
    } else {
      return { status: 'healthy', color: 'green', icon: CheckCircle };
    }
  };

  const health = getSystemHealth();
  const HealthIcon = health.icon;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive diagnostic tools for Large Language Models
          </p>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {systemStatus ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Disconnected</span>
              </div>
            )}
          </div>

          {/* System Health */}
          <div className="flex items-center gap-2">
            <HealthIcon className={clsx(
              'w-4 h-4',
              health.color === 'green' && 'text-green-600',
              health.color === 'yellow' && 'text-yellow-600', 
              health.color === 'red' && 'text-red-600',
              health.color === 'gray' && 'text-gray-400'
            )} />
            <span className={clsx(
              'text-sm font-medium capitalize',
              health.color === 'green' && 'text-green-600',
              health.color === 'yellow' && 'text-yellow-600',
              health.color === 'red' && 'text-red-600', 
              health.color === 'gray' && 'text-gray-400'
            )}>
              {health.status}
            </span>
          </div>

          {/* System Stats */}
          {systemStatus && (
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                <span>CPU: {systemStatus.system?.cpu_percent?.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Memory: {systemStatus.system?.memory?.used_percent?.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Models: {systemStatus.model_manager?.loaded_count || 0}</span>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={clsx(
              'p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              isRefreshing && 'cursor-not-allowed opacity-50'
            )}
            title="Refresh system status"
          >
            <RefreshCw className={clsx(
              'w-4 h-4 text-gray-600',
              isRefreshing && 'animate-spin'
            )} />
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {systemStatus && (
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">
              Device: <span className="font-medium">{systemStatus.model_manager?.device || 'Unknown'}</span>
            </span>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">
              Memory: <span className="font-medium">
                {(systemStatus.system?.memory?.available_gb || 0).toFixed(1)}GB available
              </span>
            </span>
          </div>

          {systemStatus.system?.gpu?.available && (
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                GPU: <span className="font-medium">{systemStatus.system.gpu.device_name}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;