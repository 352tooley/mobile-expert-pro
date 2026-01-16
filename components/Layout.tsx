
import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user?: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-magenta text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Expert Commission Pro</h1>
            <h1 className="text-xl font-bold tracking-tight block sm:hidden">Pro Portal</h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs opacity-75">{user.role}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-magenta-hover hover:bg-black px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-magenta"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-xs text-magenta font-medium">
          Expert Commission Solutions Portal
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-[10px] mt-1">
          &copy; {new Date().getFullYear()} Mobile Sales Performance Systems. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
