
import React, { useState, useEffect } from 'react';
import { District, Store, User, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    setDistricts(StorageService.getDistricts());
    setStores(StorageService.getStores());
    setUsers(StorageService.getUsers());
  }, []);

  const filteredStores = stores.filter(s => s.districtId === selectedDistrictId);
  
  // Logic: 
  // - If RD is selected, it shows up as an option in Name if everything else is empty or just always.
  // - If District is selected, show DM in Name.
  // - If Store is selected, show ME, RAM, RSM in Name.
  const filteredUsers = users.filter(u => {
    if (u.role === UserRole.RD) return true;
    if (u.role === UserRole.DM) return u.districtId === selectedDistrictId && !selectedStoreId;
    if (selectedStoreId) return u.storeId === selectedStoreId;
    return false;
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    if (user) onLogin(user);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h2>
        <div className="flex justify-center mb-8">
            <div className="bg-magenta p-3 rounded-full shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-4.514A9.01 9.01 0 0012 15a9.01 9.01 0 005.732-2.125M9.13 12.933c.833-.391 1.743-.6 2.687-.6s1.854.209 2.687.6m0 0a3 3 0 10-5.374 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">District</label>
            <select
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-magenta transition-all outline-none text-sm font-bold"
              value={selectedDistrictId}
              onChange={(e) => {
                setSelectedDistrictId(e.target.value);
                setSelectedStoreId('');
                setSelectedUserId('');
              }}
            >
              <option value="">Select District</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Store</label>
            <select
              required
              disabled={!selectedDistrictId}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-magenta transition-all outline-none disabled:opacity-50 text-sm font-bold"
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                setSelectedUserId('');
              }}
            >
              <option value="">Select Store</option>
              {filteredStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Role Name</label>
            <select
              required
              disabled={!selectedDistrictId && !selectedUserId} // Allow RD even without store
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-magenta transition-all outline-none disabled:opacity-50 text-sm font-bold"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select Option</option>
              {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={!selectedUserId}
            className="w-full bg-magenta text-white font-black py-4 rounded-xl hover:bg-magenta-hover transition-all disabled:opacity-50 shadow-xl shadow-magenta/20 uppercase tracking-widest text-xs"
          >
            Enter Portal
          </button>
        </form>
      </div>

      <div className="mt-8 p-6 bg-magenta-light rounded-2xl border border-magenta/10">
        <h4 className="text-xs font-black text-magenta mb-3 uppercase tracking-wider">Access Level Details:</h4>
        <ul className="text-[11px] text-magenta/80 space-y-2 font-medium">
          <li className="flex items-start"><span className="mr-2">🚀</span> <strong>Mobile Expert:</strong> Quiz access & Personal Results</li>
          <li className="flex items-start"><span className="mr-2">📈</span> <strong>RSM / DM:</strong> Store/District Roster & Analytics</li>
          <li className="flex items-start"><span className="mr-2">🛡️</span> <strong>RD:</strong> Regional Oversight & Admin Rights</li>
        </ul>
      </div>
    </div>
  );
};

export default Login;
