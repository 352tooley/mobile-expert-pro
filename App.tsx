
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import Layout from './components/Layout';
import Login from './components/Login';
import Quiz from './components/Quiz';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import HuntThe5 from './components/HuntThe5';
import { StorageService } from './services/storage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'quiz' | 'admin' | 'dashboard' | 'hunt'>('home');

  useEffect(() => {
    // Initialize storage with defaults if empty
    StorageService.init();
    
    const savedUser = sessionStorage.getItem('mobile_pro_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem('mobile_pro_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('mobile_pro_user');
    setActiveTab('home');
  };

  const canManageTeam = user && [UserRole.RSM, UserRole.DM, UserRole.RD].includes(user.role);
  const canSeeAnalytics = user && [UserRole.EXPERT, UserRole.RAM, UserRole.RSM, UserRole.DM, UserRole.RD].includes(user.role);

  return (
    <Layout user={user} onLogout={handleLogout}>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-magenta text-white rounded-full flex items-center justify-center font-bold text-lg border-2 border-magenta-light shadow-sm">
              {user.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Welcome, {user.name}</h2>
              <p className="text-xs text-magenta font-bold uppercase tracking-tight">{user.role}</p>
            </div>
          </div>

          <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-200">
            <button
              onClick={() => setActiveTab('home')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'home' ? 'text-magenta border-b-2 border-magenta' : 'text-gray-500 hover:text-magenta'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'quiz' ? 'text-magenta border-b-2 border-magenta' : 'text-gray-500 hover:text-magenta'
              }`}
            >
              Take Quiz
            </button>
            {canSeeAnalytics && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'dashboard' ? 'text-magenta border-b-2 border-magenta' : 'text-gray-500 hover:text-magenta'
                }`}
              >
                {user.role === UserRole.EXPERT ? 'My Results' : 'Dashboard'}
              </button>
            )}
            {canManageTeam && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'admin' ? 'text-magenta border-b-2 border-magenta' : 'text-gray-500 hover:text-magenta'
                }`}
              >
                Management
              </button>
            )}
          </nav>

          <div className="mt-4">
            {activeTab === 'home' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-magenta to-magenta-hover p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-24 h-24" fill="white" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Weekly Knowledge Check</h3>
                  <p className="opacity-90 mb-6 text-sm">Stay sharp on the latest promotions and commission structures to maximize your earnings.</p>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="bg-white text-magenta font-extrabold px-6 py-3 rounded-xl shadow-lg hover:bg-magenta-light transition-all"
                  >
                    Launch Quiz
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-1">Retail Strategy</h3>
                    <p className="text-sm text-gray-500 mb-6">Test your discovery skills.</p>
                    
                    <button
                      onClick={() => setActiveTab('hunt')}
                      className="w-full bg-magenta-light text-magenta font-extrabold py-4 rounded-2xl border-2 border-magenta/20 flex items-center justify-center hover:bg-magenta-accent transition-all group"
                    >
                      <span className="text-xl mr-2">🎯</span>
                      HUNT THE 5
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-gray-50">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-400">Employee UID</span>
                       <span className="font-mono text-magenta font-bold">{user.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <Quiz user={user} onFinish={() => setActiveTab('home')} />
            )}

            {activeTab === 'hunt' && (
              <HuntThe5 user={user} onFinish={() => setActiveTab('home')} />
            )}

            {activeTab === 'admin' && canManageTeam && (
              <AdminPanel user={user} />
            )}

            {activeTab === 'dashboard' && canSeeAnalytics && (
              <Dashboard user={user} />
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
