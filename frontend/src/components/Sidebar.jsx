import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Brain, 
  TestTube, 
  BarChart3, 
  Settings,
  Activity,
  Cpu,
  HardDrive
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ systemStatus }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and quick actions'
    },
    {
      name: 'Models',
      path: '/models', 
      icon: Brain,
      description: 'Load and manage LLM models'
    },
    {
      name: 'Tests',
      path: '/tests',
      icon: TestTube,
      description: 'Run diagnostic tests'
    },
    {
      name: 'Results',
      path: '/results',
      icon: BarChart3,
      description: 'View test results and history'
    }
  ];

  const isActive = (path) => location.pathname === path;

  const getSystemStatusColor = () => {
    if (!systemStatus) return 'gray';
    
    const { system } = systemStatus;
    if (system?.memory?.used_percent > 90 || system?.cpu_percent > 90) {
      return 'red';
    } else if (system?.memory?.used_percent > 70 || system?.cpu_percent > 70) {
      return 'yellow';
    }
    return 'green';
  };

  const statusColor = getSystemStatusColor();
  const statusColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500', 
    red: 'bg-red-500',
    gray: 'bg-gray-400'
  };

  return (
    <div className="bg-white w-64 min-h-screen shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">LLM Diagnostic</h1>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className={clsx(
                    'w-5 h-5',
                    active ? 'text-blue-700' : 'text-gray-500'
                  )} />
                  <div className="text-left">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">System Status</span>
            <div className={clsx(
              'w-2 h-2 rounded-full',
              statusColors[statusColor]
            )} />
          </div>
          
          {systemStatus ? (
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  <span>CPU</span>
                </div>
                <span>{systemStatus.system?.cpu_percent?.toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  <span>Memory</span>
                </div>
                <span>{systemStatus.system?.memory?.used_percent?.toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  <span>Models</span>
                </div>
                <span>{systemStatus.model_manager?.loaded_count || 0}</span>
              </div>
              
              {systemStatus.system?.gpu?.available && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>GPU</span>
                  </div>
                  <span>{(systemStatus.system.gpu.memory_allocated || 0).toFixed(0)}MB</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500">Loading...</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <div>v1.0.0</div>
          <div className="mt-1">
            Device: {systemStatus?.model_manager?.device || 'Unknown'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;