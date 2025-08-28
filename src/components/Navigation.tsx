import { Calendar, CheckSquare, Target } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation = () => {
  const location = useLocation();
  
  const tabs = [
    { id: 'dashboard', label: 'ホーム', icon: Calendar, path: '/dashboard' },
    { id: 'todos', label: 'タスク', icon: CheckSquare, path: '/todos' },
    { id: 'habits', label: '習慣', icon: Target, path: '/habits' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-large">
      <div className="flex justify-around items-center h-16 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'text-primary bg-primary-soft scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};